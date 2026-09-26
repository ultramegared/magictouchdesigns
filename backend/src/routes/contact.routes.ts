import { Router } from "express";
import {
    contactUpload,
    submitCustomRequest,
    submitSupportRequest,
} from "../controllers/contact.controller";

const router = Router();

router.post(
    "/custom-request",
    contactUpload,
    submitCustomRequest
);

router.post(
    "/support",
    submitSupportRequest
);

export default router;
