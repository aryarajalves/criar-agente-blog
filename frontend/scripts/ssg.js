import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:8000';
const SITE_URL = 'http://localhost:5300'; // Trocar pela URL final em produção

async function runSSG() {
  console.log('🚀 Iniciando geração estática de posts (SSG)...');
  
  const distPath = path.resolve(__dirname, '../dist');
  const indexPath = path.join(distPath, 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.error('❌ Erro: dist/index.html não encontrado. Execute "npm run build" primeiro.');
    process.exit(1);
  }
  
  const templateHtml = fs.readFileSync(indexPath, 'utf-8');
  
  try {
    console.log(`📡 Buscando posts publicados de: ${API_BASE_URL}/api/posts`);
    const res = await fetch(`${API_BASE_URL}/api/posts`);
    if (!res.ok) {
      throw new Error(`Erro na API: ${res.statusText}`);
    }
    
    const posts = await res.json();
    console.log(`📝 Encontrados ${posts.length} posts para renderização estática.`);
    
    let sitemapUrls = [];
    sitemapUrls.push(`<url><loc>${SITE_URL}/</loc><priority>1.0</priority></url>`);
    sitemapUrls.push(`<url><loc>${SITE_URL}/login</loc><priority>0.3</priority></url>`);

    for (const post of posts) {
      const postDir = path.join(distPath, 'post', post.slug);
      fs.mkdirSync(postDir, { recursive: true });
      
      // Personalizar meta tags de SEO no template
      let postHtml = templateHtml;
      
      // Substituir Title
      const titleTag = `<title>${post.title} | Aryaraj - Interfaces</title>`;
      postHtml = postHtml.replace(/<title>.*?<\/title>/, titleTag);
      
      // Inserir Meta Description e tags Open Graph
      const tagsMeta = post.tags 
        ? post.tags.split(',').map(tag => `<meta property="article:tag" content="${tag.trim().replace(/"/g, '&quot;')}" />`).join('\n    ')
        : '';

      const seoMeta = `
    <meta name="description" content="${post.summary.replace(/"/g, '&quot;')}" />
    <meta property="og:title" content="${post.title.replace(/"/g, '&quot;')}" />
    <meta property="og:description" content="${post.summary.replace(/"/g, '&quot;')}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${SITE_URL}/post/${post.slug}" />
    ${post.cover_image_url ? `<meta property="og:image" content="${post.cover_image_url}" />` : ''}
    <meta name="twitter:card" content="summary_large_image" />
    ${tagsMeta}
      `.trim();
      
      // Inserir as meta tags no head
      postHtml = postHtml.replace('</head>', `${seoMeta}\n  </head>`);
      
      // Escrever o arquivo index.html da pasta do post
      fs.writeFileSync(path.join(postDir, 'index.html'), postHtml, 'utf-8');
      console.log(`✅ Gerado: /post/${post.slug}/index.html`);
      
      // Adicionar à lista de sitemap
      sitemapUrls.push(`<url><loc>${SITE_URL}/post/${post.slug}</loc><lastmod>${new Date(post.updated_at).toISOString().split('T')[0]}</lastmod><priority>0.8</priority></url>`);
    }
    
    // Gerar Sitemap.xml
    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemapUrls.join('\n  ')}
</urlset>
    `.trim();
    
    fs.writeFileSync(path.join(distPath, 'sitemap.xml'), sitemapContent, 'utf-8');
    console.log('✅ Sitemap.xml gerado com sucesso em dist/sitemap.xml!');
    console.log('🎉 SSG concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Falha ao gerar posts estáticos (SSG):', error);
  }
}

runSSG();
