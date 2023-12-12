/**
 *  Options to create the email.
 * 
 *  from: '"Fred Foo" <foo@example.com>', // dirección del remitente
 *  to: 'bar@example.com, baz@example.com', // lista de receptores
 *  subject: 'Hello ✔', // Línea de asunto
 *  text: 'Hello world?', // cuerpo de texto plano
 *  html: '<b>Hello world?</b>' // cuerpo de html
 * */

class MailOptions {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;

    constructor(from:string, to:string, subject:string, text:string, html:string) {
        this.from = from;
        this.to = to;
        this.subject = subject;
        this.text = text;
        this.html = html;
    }
}

export default MailOptions;
