import * as nodemailer from 'nodemailer';
import ConfigSMTP from "./ConfigSmtp";
import MailOptions from './MailOptions';
/**
 * Email sender will create a transport for SMTP and send custom emails.
 */
export default class EmailSender {
    private transporter: nodemailer.Transporter;

    constructor(configSMTP: ConfigSMTP) {
        // this.transporter = nodemailer.createTransport(configSMTP);
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'alarmasgeswat@gmail.com',
              pass: 'wrbvgaqlimyquibr'
            } ,
            tls : {
                rejectUnauthorized: false
            }
          });
    }

    async sendEmail(mailOptions: MailOptions) {
        try {
            console.log(mailOptions)
            let info = await this.transporter.sendMail(mailOptions);
            console.log('Message sent: %s', info.messageId);
        } catch (error) {
            console.error('Error occurred while sending email. This error should be reported. ', error);
        }
    }
}
