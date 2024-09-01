import express from "express";
import {
  addNewSkill,
  deleteNewSkill,
  updateSkill,
  getAllSkills,
} from "../controller/skillController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/add", isAuthenticated, addNewSkill);
router.delete("/delete/:id", isAuthenticated, deleteNewSkill);
router.put("/update/:id", isAuthenticated, updateSkill);
router.get("/getall", getAllSkills);

export default router;
