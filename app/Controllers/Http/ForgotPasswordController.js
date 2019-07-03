"use strict";

const moment = require("moment");
const Mail = use("Mail");
const crypto = require("crypto");
const User = use("App/Models/User");

class ForgotPasswordController {
  async store({ request, response }) {
    try {
      const email = request.input("email");
      const user = await User.findByOrFail("email", email);

      user.token = crypto.randomBytes(10).toString("hex");
      user.token_created_at = new Date();

      await user.save();

      await Mail.send(
        ["emails.forgot_password"],
        {
          email,
          token: user.token,
          link: `${request.input("redirect_url")}?token=${user.token}`
        },
        message => {
          message
            .from("savoini@unicamp.br", "Savoini | Unicamp")
            .to(user.email)
            .subject("Recuperação de senha");
        }
      );
    } catch (error) {
      return response.status(error.status).send({
        error: { message: "Invalid e-mail" }
      });
    }
  }

  async update({ request, response }) {
    try {
      const { token, password } = request.all();
      const user = await User.findByOrFail({ token: token });

      const tokenExpirated = moment()
        .subtract("2", "days")
        .isAfter(user.token_created_at);

      if (tokenExpirated) {
        return response.status(401).send({
          error: { message: "O token de recuperação está expirado" }
        });
      }

      user.token = null;
      user.token_created_at = null;
      user.password = password;

      await user.save();
    } catch (error) {
      return response.status(error.status).send({
        error: { message: "Algo deu errado ao alterar a senha" }
      });
    }
  }
}

module.exports = ForgotPasswordController;
