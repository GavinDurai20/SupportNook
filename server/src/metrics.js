const client = require("@prometheus-io/client");

const { register, collectDefaultMetrics, Counter, Histogram } = client;

collectDefaultMetrics({
  prefix: "supportnook_",
});

const httpRequestsTotal = new Counter({
  name: "supportnook_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

const httpRequestDuration = new Histogram({
  name: "supportnook_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});

module.exports = {
  register,
  httpRequestsTotal,
  httpRequestDuration,
};