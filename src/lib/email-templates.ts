// Branded HTML email templates for transactional mail sent through Brevo
// (see src/lib/mailer.ts). Kept framework-free (plain template strings —
// no JSX) since these render inside email clients, not the app, and need
// inlined styles / table layout for compatibility with Outlook & Gmail.
//
// Font: Poppins, loaded via Google Fonts <link>/@import with a system
// sans-serif fallback stack, since some email clients (notably Outlook
// desktop on Windows) don't support web fonts and will fall back silently.

const BRAND = {
  name: "Taripon",
  jade: "#1f6f52",
  jadeDark: "#163f30",
  jadeGlow: "#2f9270",
  gold: "#c99a3f",
  linen: "#fdfaf3",
  ink: "#1b2e26",
  muted: "#5b6b64",
  border: "#e7e0d2",
  fontStack: "'Poppins', 'Segoe UI', Helvetica, Arial, sans-serif",
};

function emailShell(opts: { preheader: string; bodyHtml: string }) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${BRAND.name}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <!--[if mso]>
    <style>
      body, table, td, a, h1, p { font-family: 'Segoe UI', Arial, sans-serif !important; }
    </style>
    <![endif]-->
    <style>
      @media screen {
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:${BRAND.linen};font-family:${BRAND.fontStack};">
    <span style="display:none;font-size:1px;color:${BRAND.linen};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
      ${opts.preheader}
    </span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.linen};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:20px;border:1px solid ${BRAND.border};overflow:hidden;">
            <tr>
              <td align="center" style="background-color:${BRAND.jade};background-image:linear-gradient(135deg,${BRAND.jadeDark} 0%,${BRAND.jade} 55%,${BRAND.jadeGlow} 100%);padding:28px 32px;text-align:center;">
                <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
                  <tr>
                    <td style="font-family:${BRAND.fontStack};font-size:22px;font-weight:700;letter-spacing:0.04em;color:#ffffff;white-space:nowrap;">
                      &nbsp;<span style="color:#ffffff;">${BRAND.name}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 8px 32px;">
                ${opts.bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px 32px;border-top:1px solid ${BRAND.border};">
                <p style="margin:16px 0 0 0;font-size:12px;line-height:18px;color:${BRAND.muted};">
                  You're receiving this email because it was requested for an account on ${BRAND.name}. If this
                  wasn't you, you can safely ignore this message.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:20px 0 0 0;font-size:11px;color:${BRAND.muted};">
            &copy; ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function passwordResetEmail(opts: { actionLink: string; email: string }) {
  const subject = `Reset your ${BRAND.name} password`;
  const bodyHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 20px auto;">
      <tr>
        <td width="48" height="48" align="center" valign="middle" style="border-radius:999px;background-color:#eef4f0;font-size:22px;line-height:48px;text-align:center;">
          🔒
        </td>
      </tr>
    </table>
    <h1 style="margin:0 0 8px 0;font-size:20px;line-height:28px;color:${BRAND.ink};text-align:center;font-family:${BRAND.fontStack};font-weight:600;">
      Reset your password
    </h1>
    <p style="margin:0 0 24px 0;font-size:14px;line-height:22px;color:${BRAND.muted};text-align:center;">
      We received a request to reset the password for <strong style="color:${BRAND.ink};">${opts.email}</strong>.
      Click the button below to choose a new one.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 24px auto;">
      <tr>
        <td style="border-radius:999px;background-color:${BRAND.jade};">
          <a href="${opts.actionLink}"
             style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px;font-family:${BRAND.fontStack};">
            Reset password
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 6px 0;font-size:12px;line-height:20px;color:${BRAND.muted};text-align:center;">
      Valid for one-time use for 1 hour.
    </p>
    <p style="margin:24px 0 0 0;font-size:12px;line-height:20px;color:${BRAND.muted};text-align:center;">
      Didn't request this? You can safely ignore this email.
    </p>
  `;
  const html = emailShell({
    preheader: `Reset your ${BRAND.name} password — this link expires in 1 hour.`,
    bodyHtml,
  });
  const text = [
    `Reset your ${BRAND.name} password`,
    ``,
    `We received a password reset request for  ${opts.email}.`,
    `Use this link to set a new password (expires in 1 hour, one-time use).:`,
    opts.actionLink,
    ``,
    `Didn't request this? Ignore this email—your password will remain unchanged.`,
  ].join("\n");

  return { subject, html, text };
}
