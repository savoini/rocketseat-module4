"use strict";

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
        error: {
          message: "Invalid e-mail"
        }
      });
    }
  }
}

module.exports = ForgotPasswordController;
