import express, { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import { connectDB } from "./connection/connectDB";
import usersRoutes from "./routes/usersRoutes";

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.use(cors());
app.use(express.json());

app.use("/users", usersRoutes);

app.get("/", (req: Request, res: Response) => {
    res.send("Servidor funcionando en TypeScript!");
});

app.listen(PORT, () => {
    console.log(`Servidor corriendooo en http://localhost:${PORT}`);
});
