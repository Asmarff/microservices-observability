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

    console.log(`Service B received ${ req.method } ${ req.url }`);

    // This endpoint is called by Service A.
    // Service B calls Service A back.
    if (req.url === "/from-a") {
        const request = http.get(
            "http://service-a:8001/from-b",
            (serviceARes) => {
                let data = "";

                serviceARes.on("data", (chunk) => {
                    data += chunk;
                });

                serviceARes.on("end", () => {
                    res.writeHead(200, {
                        "Content-Type": "application/json",
                    });

                    res.end(
                        JSON.stringify({
                            service: "service-b",
                            message: "Service B called Service A back",
                            serviceAResponse: JSON.parse(data),
                            timestamp: new Date().toISOString(),
                        })
                    );
                });
            }
        );

        request.on("error", (error) => {
            console.error("Service A request failed:", error);

            res.writeHead(503, {
                "Content-Type": "application/json",
            });

            res.end(
                JSON.stringify({
                    service: "service-b",
                    error: "Service A unavailable",
                })
            );
        });

        return;
    }

    // Direct request to Service B
    res.writeHead(200, {
        "Content-Type": "application/json",
    });

    res.end(
        JSON.stringify({
            service: "service-b",
            message: "Hello from Service B",
            timestamp: new Date().toISOString(),
        })
    );
});

server.listen(8002, "0.0.0.0", () => {
    console.log("Service B running on port 8002");
});