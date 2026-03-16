const responseTime = () => (req, res, next) => {
  const start = process.hrtime.bigint();
  // Intercept writeHead to inject the header BEFORE it is sent to the client.
  // Setting headers inside the 'finish' event is too late (headers already flushed)
  // and would throw ERR_HTTP_HEADERS_SENT.
  const originalWriteHead = res.writeHead.bind(res);
  res.writeHead = function (statusCode, ...rest) {
    const duration = Number(process.hrtime.bigint() - start) / 1e6;
    if (!res.getHeader('X-Response-Time')) {
      res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
    }
    return originalWriteHead(statusCode, ...rest);
  };
  next();
};

export default responseTime;
