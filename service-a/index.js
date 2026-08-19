require("./tracing");

const http = require("http");

let requests = 0;

const server = http.createServer((req, res) => {
    // Prometheus metrics
    if (req.url === "/metrics") {
        res.writeHead(200, {
            "Content-Type": "text/plain; version=0.0.4",
        });

        res.end(
            `# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total ${ requests }
`
        );

        return;
    }

    requests++;

    console.log(`Service A received ${ req.method } ${ req.url }`);

    // This endpoint is called by Service B.
    // It does NOT call Service B again.
    if (req.url === "/from-b") {
        res.writeHead(200, {
            "Content-Type": "application/json",
        });

        res.end(
            JSON.stringify({
                service: "service-a",
                message: "Hello from Service A",
                calledBy: "service-b",
                timestamp: new Date().toISOString(),
            })
        );

        return;
    }

    // Normal endpoint:
    // Service A calls Service B.
    const request = http.get(
        "http://service-b:8002/from-a",
        (serviceBRes) => {
            let data = "";

            serviceBRes.on("data", (chunk) => {
                data += chunk;
            });

            serviceBRes.on("end", () => {
                res.writeHead(200, {
                    "Content-Type": "application/json",
                });

                res.end(
                    JSON.stringify({
                        service: "service-a",
                        message: "Service A called Service B",
                        serviceBResponse: JSON.parse(data),
                        timestamp: new Date().toISOString(),
                    })
                );
            });
        }
    );

    request.on("error", (error) => {
        console.error("Service B request failed:", error);

        res.writeHead(503, {
            "Content-Type": "application/json",
        });

        res.end(
            JSON.stringify({
                service: "service-a",
                error: "Service B unavailable",
            })
        );
    });
});

server.listen(8001, "0.0.0.0", () => {
    console.log("Service A running on port 8001");
});