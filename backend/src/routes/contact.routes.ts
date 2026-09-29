import { Router } from "express";
import {
    contactUpload,
    getCustomRequestCheckout,
    submitCustomRequest,
    submitSupportRequest,
} from "../controllers/contact.controller";

const router = Router();

router.post(
    "/custom-request",
    contactUpload,
    submitCustomRequest
);

router.get(
    "/custom-request/:id",
    getCustomRequestCheckout
);

router.post(
    "/support",
    contactUpload,
    submitSupportRequest
);

export default router;
