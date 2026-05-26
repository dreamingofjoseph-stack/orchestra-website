import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adminRouter from "./admin";
import concertsRouter from "./concerts";
import programsRouter from "./programs";
import eventsRouter from "./events";
import opportunitiesRouter from "./opportunities";
import boardRouter from "./board";
import boostersRouter from "./boosters";
import boosterOfficersRouter from "./boosterOfficers";

const router: IRouter = Router();

router.use(healthRouter);
router.use(adminRouter);
router.use(concertsRouter);
router.use(programsRouter);
router.use(eventsRouter);
router.use(opportunitiesRouter);
router.use(boardRouter);
router.use(boostersRouter);
router.use(boosterOfficersRouter);

export default router;
