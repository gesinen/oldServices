"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const usersController_1 = __importDefault(require("../controllers/usersController"));
const waterUsersController_1 = __importDefault(require("../controllers/water_module/waterUsersController"));
class UsersRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        /**
         * Get the user data
         * GET ('/information/:id')
         */
        this.getUserInformationAction = () => this.router.get("/information/:id", (req, res) => {
            const id = parseInt(req.params.id);
            usersController_1.default
                .getUserInformation(id)
                .then((response) => {
                res.send(response);
            })
                .catch((err) => {
                res.send(err);
            });
        });
        /**
         * Get user related municipality_id
         * GET ('/municipality/{user_id}')
         * params user_id -> id of the user we want to get the municipality_id from
         */
        this.getUserServersAction = () => this.router.get("/municipality/:user_id", (req, res) => {
            const user_id = req.params.user_id;
            waterUsersController_1.default
                .getWaterUserMunicipalityId(parseInt(user_id))
                .then((response) => {
                res.send(response);
            })
                .catch((err) => {
                res.send(err);
            });
        });
        /**
         * Get the user data
         * GET ('/login')
         */
        this.getUserLoginAction = () => this.router.post("/login", (req, res) => {
            const mail = req.body.email;
            const pass = req.body.password;
            usersController_1.default
                .getUserLogin(mail, pass)
                .then((response) => {
                res.send(response);
            })
                .catch((err) => {
                res.send(err);
            });
        });
        /**
         * Get the user data
         * GET ('/login')
         */
        this.getUserIdByMailAction = () => this.router.post("/getUserByNif/:mail", (req, res) => {
            const mail = req.params.mail;
            usersController_1.default
                .getUserIdByMail(mail)
                .then((response) => {
                res.send(response);
            })
                .catch((err) => {
                res.send(err);
            });
        });
        this.getUserInformationAction();
        this.getUserLoginAction();
    }
}
const userRouter = new UsersRouter();
exports.default = userRouter.router;
