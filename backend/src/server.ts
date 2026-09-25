import "dotenv/config";
import app from "./app";

const PORT = Number(process.env.PORT ?? 5000);
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`SCM Backend listening on port ${PORT}`);
});
