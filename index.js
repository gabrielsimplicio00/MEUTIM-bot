import puppeteer from "puppeteer";
import nodemailer from "nodemailer";
import cron from "node-cron";
import express from "express";
import axios from "axios";
import "dotenv/config";

const app = express();
const port = 3333;

app.get("/", () => main());

// (0 10 1 * *) -> executa sempre as 10 da manhã, no primeiro dia de cada mes
cron.schedule("0 10 1 * *", async () => {
  try {
    await axios.get(`http://localhost:${port}/`);
  } catch (error) {
    console.error("Erro na requisição:", error.message);
  }
});

async function main() {
  try {
    const browser = await puppeteer.launch({
      // headless: false,
      // slowMo: 100,
    });
    const page = await browser.newPage();

    await page.setExtraHTTPHeaders({ "Cache-Control": "no-cache" });
    page.setDefaultTimeout(210_000);
    page.setDefaultNavigationTimeout(60_000);

    // Navigate the page to a URL
    await page.goto("https://meutim.tim.com.br/novo/login");
    await page.waitForNavigation();

    // Set screen size
    await page.setViewport({ width: 1080, height: 1024 });

    // Wait and click on first result
    const inputNumero = await page.$("#campo-numero");
    const inputSenha = await page.$("#campo-senha");
    const btnEntrar = "#btn-entrar";

    await inputNumero.type(process.env.NUMERO, { delay: 50 });
    await inputSenha.type(process.env.SENHA, { delay: 50 });
    await page.click(btnEntrar);

    await getFatura(page);

    await browser.close();
  } catch (error) {
    console.error("Erro ao executar o bot: ", error);
    console.log("Reiniciando o bot...");
    setTimeout(() => main(), 5000);
  }
}

async function getFatura(page) {
  page.setDefaultNavigationTimeout(60_000);
  await page.waitForTimeout(15_000);

  const btnPagarFatura = "button[title='Pagar agora']";

  await page.click(btnPagarFatura);

  await sendMailWithContent(page);
}

async function sendMailWithContent(page) {
  await page.setDefaultNavigationTimeout(60_000);
  await page.waitForTimeout(15_000);

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
    to: `${process.env.EMAIL2}`,
    subject: "Código de barras extrato Meu TIM",
    text: `Código de barras do extrato desse mês:

    ${codigoDeBarras}`,
  };

  return transporter.sendMail(message, (err, info) => {
    if (err) {
      console.log("Erro ao enviar o e-mail:", err);
    } else {
      console.log("E-mail enviado com sucesso! ", info.response);
    }
  });
}

app.listen(port, () => {
  console.log(`Servidor Express rodando na porta ${port}`);
});
