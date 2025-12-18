// server.js (trecho de criação de site)
app.post('/create-site/:id', upload.fields([{ name: 'fotos' }, { name: 'musica', maxCount:1 }]), (req, res) => {
  const { id } = req.params;
  const { nome, mensagem, carta, fundo } = req.body;
  const fotos = req.files['fotos'] || [];
  const musica = req.files['musica'] ? req.files['musica'][0] : null;

  const siteFolder = path.join(__dirname, 'sites', id);
  if(!fs.existsSync(siteFolder)) fs.mkdirSync(siteFolder, { recursive:true });

  // Mover arquivos
  fotos.forEach((f,i)=>{
    fs.renameSync(f.path, path.join(siteFolder, `foto${i+1}${path.extname(f.originalname)}`));
  });
  if(musica) fs.renameSync(musica.path, path.join(siteFolder, `musica${path.extname(musica.originalname)}`));

  // Gerar HTML do site romântico
  const fotosHtml = fotos.map((f,i)=>`<img src="foto${i+1}${path.extname(f.originalname)}" class="foto">`).join('\n');
  const musicaHtml = musica ? `<audio controls src="musica${path.extname(musica.originalname)}"></audio>` : '';
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${nome} ❤️</title>
<style>
body{margin:0;background:#000;color:#fff;font-family:Arial,sans-serif;text-align:center;}
.foto{width:80%;max-width:400px;margin:20px auto;border-radius:20px;border:3px solid #ffb3d9;}
audio{width:80%;margin:20px auto;display:block;}
h1,h2{color:#ffb3d9;}
body{background:${fundo || 'black'};}
</style>
</head>
<body>
<h1>${nome}</h1>
<h2>${mensagem}</h2>
<p>${carta}</p>
${fotosHtml}
${musicaHtml}
</body>
</html>
`;

  fs.writeFileSync(path.join(siteFolder, 'index.html'), html);

  // Salvar info no backend
  sitesCriados[id] = {
    liberado: false,
    pasta: siteFolder,
    qrCode: `https://site-romantico-backend.onrender.com/sites/${id}/index.html`
  };

  res.json({ success:true, message:'Site criado com sucesso, aguarde pagamento.' });
});
