const nodemailer = require('nodemailer')
const pug = require('pug')
const htmlToText = require('html-to-text')

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email
    this.firstName = user.name.split(' ')[0]
    this.url = url
    this.from = `<Name Surname> ${process.env.EMAIL_FROM}`
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
        
          user: `${process.env.SENDGRID_USERNAME}`,
          pass: `${process.env.SENDGRID_PASSWORD}`
        }
      });
    }
    if (process.env.NODE_ENV === 'development') {
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_NAME,
          pass: process.env.EMAIL_PASSWORD
        }
      })
    }
  }

  async send(template, subject) {
    // TODO render HTML
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject
      })


    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      html,
      text: htmlToText.convert(html, { wordwrap: null })
    }

    //TODO create transp. and send email
    await this.newTransport().sendMail(mailOptions)

  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to Natours!')
  }

  async sendPaswordReset() {
    await this.send('passwordReset', 'Your password reset token valid for 10 minutes.')
  }

}
