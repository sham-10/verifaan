import { buildServer } from "./app.js";

const app = buildServer();

app.listen({ port: 3000 }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
