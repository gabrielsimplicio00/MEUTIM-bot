import puppeteer from "puppeteer";
import nodemailer from "nodemailer";
import dados from "./credentials.json" assert { type: "json" };
import "dotenv/config";

(async () => {
  const browser = await puppeteer.launch({
    // headless: false,
    // slowMo: 100,
  });
  const page = await browser.newPage();

  await page.setExtraHTTPHeaders({ "Cache-Control": "no-cache" });

  // Navigate the page to a URL
  await page.goto("https://meutim.tim.com.br/novo/login");
  await page.waitForNavigation();

  page.setDefaultTimeout(180_000);

  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 });

  // Wait and click on first result
  const inputNumero = await page.$("#campo-numero");
  const inputSenha = await page.$("#campo-senha");
  const btnEntrar = "#btn-entrar";

  await inputNumero.type(dados.numero, { delay: 50 });
  await inputSenha.type(dados.senha, { delay: 50 });
  await page.click(btnEntrar);

  await extractPDF(page);

  await browser.close();
})();

async function extractPDF(page) {
  await page.waitForTimeout(10_000);
  const btnPagarFatura = "button[title='Pagar agora']";

  // ".status-em-aberto .view-pdf";   button[title='Pagar agora'] button.btn-grito.btn-small.btn-verde

  await page.click(btnPagarFatura);

  await sendInfo(page);
}

async function sendInfo(page) {
  await page.waitForTimeout(10_000);

  const codigoDeBarras = await page.$eval(
    ".code-bar",
    (element) => element.textContent
  );

  const transporter = nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL1,
      pass: process.env.SENHAEMAIL1,
    },
  });

  const message = {
    from: `Gabriel Simplicio <${process.env.EMAIL1}>`,
    to: process.env.EMAIL2,
    subject: "Código de barras extrato Meu TIM",
    text: `Código de barras da conta desse mês:

    ${codigoDeBarras}`,
  };

  return transporter.sendMail(message, (err, info) => {
    if (err) {
      console.log("Erro ao enviar o e-mail:", err);
    } else {
      console.log("E-mail enviado:", info.response);
    }
  });
}
