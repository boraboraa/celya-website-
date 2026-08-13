/**
 * 410 Gone — anciennes pages de services qui n'ont aucun équivalent sur le site actuel.
 *
 * Rediriger ces URLs vers l'accueil les fait traiter comme des soft 404 : Google les
 * garde en file d'attente et consomme le budget d'exploration. Un 410 dit explicitement
 * « cette page n'existe plus », ce qui les sort de la file.
 *
 * Les URLs concernées sont réécrites vers cette fonction dans vercel.json (section
 * "rewrites") : l'URL demandée reste inchangée, seul le statut de la réponse change.
 */
module.exports = (req, res) => {
  res.statusCode = 410;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.end(
    '<!DOCTYPE html>\n' +
    '<html lang="fr">\n' +
    '<head>\n' +
    '<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>Page supprimee - Celya</title>\n' +
    '<style>' +
    'html{color-scheme:dark}' +
    'body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;' +
    'background:#070A14;color:#E6EEFF;font:400 16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;' +
    'text-align:center;padding:24px}' +
    'main{max-width:34rem}' +
    'h1{font-size:22px;margin:0 0 12px;font-weight:700}' +
    'p{margin:0 0 20px;color:#AAB6D0}' +
    'a{display:inline-block;padding:12px 22px;border-radius:99px;text-decoration:none;color:#070A14;' +
    'font-weight:600;background:linear-gradient(90deg,#22D3EE,#4F7BFF,#A855F7)}' +
    '</style>\n' +
    '</head>\n' +
    '<body>\n' +
    '<main>\n' +
    '<h1>Cette page n’existe plus</h1>\n' +
    '<p>L’offre présentée ici a été arrêtée. Celya est aujourd’hui un secrétariat téléphonique\n' +
    'avec assistante vocale pour les indépendants et les PME en Belgique.</p>\n' +
    '<a href="https://celya.be/">Aller à l’accueil</a>\n' +
    '</main>\n' +
    '</body>\n' +
    '</html>\n'
  );
};
