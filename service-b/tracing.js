const { NodeSDK } = require("@opentelemetry/sdk-node");
const {
    OTLPTraceExporter,
} = require("@opentelemetry/exporter-trace-otlp-grpc");
const {
    getNodeAutoInstrumentations,
} = require("@opentelemetry/auto-instrumentations-node");

const traceExporter = new OTLPTraceExporter({
    url: "http://alloy:4317",
});

const sdk = new NodeSDK({
    traceExporter,
    instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

process.on("SIGTERM", async () => {
    await sdk.shutdown();
    process.exit(0);
});