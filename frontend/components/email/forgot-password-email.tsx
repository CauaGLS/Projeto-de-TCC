import * as React from "react";

interface ForgotPasswordEmailProps {
  user: { name?: string | null; email: string };
  url: string;
  token: string;
}

export function ForgotPasswordEmail({ user, url }: ForgotPasswordEmailProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>Redefinição de senha</title>
      </head>
      <body style={{ fontFamily: "Arial, sans-serif", background: "#f9fafb", padding: "20px" }}>
        <table
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ maxWidth: "600px", margin: "0 auto", background: "#ffffff", borderRadius: "8px", padding: "24px" }}
        >
          <tr>
            <td style={{ textAlign: "center" }}>
              <h1 style={{ margin: "0 0 16px 0", color: "#111827" }}>Redefinir senha</h1>
            </td>
          </tr>
          <tr>
            <td style={{ padding: "12px 0", fontSize: "16px", color: "#374151" }}>
              <p>Olá {user.name || user.email},</p>
              <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
              <p>
                Para continuar, clique no botão abaixo:
              </p>
              <p style={{ textAlign: "center", margin: "24px 0" }}>
                <a
                  href={url}
                  style={{
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    padding: "12px 24px",
                    borderRadius: "6px",
                    textDecoration: "none",
                    fontWeight: "bold",
                  }}
                >
                  Redefinir senha
                </a>
              </p>
              <p>Ou copie e cole este link no seu navegador:</p>
              <p style={{ wordBreak: "break-word", color: "#2563eb" }}>{url}</p>
              <p>Se você não solicitou essa alteração, ignore este e-mail.</p>
            </td>
          </tr>
          <tr>
            <td style={{ paddingTop: "24px", fontSize: "12px", color: "#6b7280", textAlign: "center" }}>
              © {new Date().getFullYear()} Projeto de TCC. Todos os direitos reservados.
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
}
