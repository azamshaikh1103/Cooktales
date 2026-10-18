export const BRAND_COLOR = '#006C5E';
export const BG_COLOR = '#f3f4f6';
export const TEXT_COLOR = '#374151';

const LOGO_URL =
  'https://res.cloudinary.com/dtlfdwhnm/image/upload/w_300,f_png/v1764539263/BlackCTCornered_ps5osj.svg';

export const wrapEmail = (
  title: string,
  contentHtml: string,
  actionUrl: string,
  actionText: string
) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>${title}</title>
    <style>
      @media only screen and (max-width: 620px) {
        .container { width: 100% !important; }
        .content { padding: 20px !important; }
        .main { border-radius: 0 !important; }
        h1 { font-size: 24px !important; }
      }
    </style>
  </head>
  <body style="background-color: ${BG_COLOR}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; font-size: 16px; line-height: 1.6; margin: 0; padding: 0;">

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${BG_COLOR}; padding: 40px 0;">
      <tr>
        <td align="center">

          <!-- BRAND HEADER -->
          <div style="margin-bottom: 24px; text-align: center;">
             <img src="${LOGO_URL}" alt="CookTale" width="150" style="width: 150px; height: auto; display: block; margin: 0 auto;" />
          </div>

          <!-- MAIN CARD -->
          <table role="presentation" class="main" width="580" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; border-spacing: 0;">

            <!-- CONTENT -->
            <tr>
              <td style="padding: 40px;">
                <h1 style="margin: 0 0 20px; font-size: 28px; font-weight: 800; color: #111827; letter-spacing: -0.5px; text-align: center;">
                   ${title}
                </h1>

                <div style="color: ${TEXT_COLOR}; font-size: 16px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
                   ${contentHtml}
                </div>

                <!-- CTA BUTTON -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center">
                      <a href="${actionUrl}" target="_blank" style="display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: bold; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 6px rgba(0,108,94,0.2);">
                        ${actionText}
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin-top: 30px; font-size: 12px; color: #9ca3af; text-align: center;">
                   If the button doesn't work, copy this link:<br/>
                   <a href="${actionUrl}" style="color: ${BRAND_COLOR}; text-decoration: underline;">${actionUrl}</a>
                </p>
              </td>
            </tr>
          </table>

          <!-- FOOTER -->
          <div style="margin-top: 24px; text-align: center; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0 0 10px;">© 2025 CookTale Inc. All rights reserved.</p>
            <p style="margin: 0;">Made with <span style="color: ${BRAND_COLOR}; font-size: 14px;">&hearts;</span> by Chefs in Mumbai.</p>
            <div style="margin-top: 12px;">
               <a href="https://cooktale.in" style="color: #9ca3af; text-decoration: none; margin: 0 8px;">Website</a> •
               <a href="https://instagram.com/cooktale.in" style="color: #9ca3af; text-decoration: none; margin: 0 8px;">Instagram</a>
            </div>
          </div>

        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};
