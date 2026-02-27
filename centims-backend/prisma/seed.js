require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrant productes inicials...');

  // Obtenir l'admin per usar el seu ID com a creador
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const adminId = admin ? admin.id : 1;

  const products = [
    {
      name: 'Renfe Executive Delay',
      emoji: '🚄',
      ticker: 'RESA',
      description: 'Renfe Executive Delay sona com una experiència premium, però tots sabem que és l\'art mil·lenari d\'arribar tard amb classe. És aquell moment en què el panell anuncia "retard indeterminat" i tu mires el rellotge com si això pogués intimidar el temps.',
      p0: 0.16,
      k: 0.00016,
    },
    {
      name: 'Calçot 4K',
      emoji: '🧅',
      ticker: 'CL4K',
      description: 'Calçot 4K és la versió d\'alta definició d\'un ritual ancestral: ceba llarga, foc viu i salsa que taca fins l\'ànima. En 4K pots apreciar cada fibra cremada, cada gota de romesco lliscant amb dramatisme cinematogràfic.',
      p0: 0.15,
      k: 0.00015,
    },
    {
      name: "Omilies d'Organyà",
      emoji: '⛪',
      ticker: 'ORGA',
      description: 'Les Omilies d\'Organyà són com el primer "hola món" del català escrit. Un conjunt de sermons del segle XII que demostren que la llengua ja tenia ganes de sortir a passejar molt abans que existissin els tuits indignats.',
      p0: 0.20,
      k: 0.00020,
    },
    {
      name: 'Yamin Lamal',
      emoji: '⚽',
      ticker: 'YALA',
      description: 'Si parlem de talent precoç, és impossible no pensar en Lamine Yamal. És el tipus de jugador que fa que els adults discuteixin si "a la seva edat" ja prometia tant. Té aquella combinació irritant de serenitat i atreviment.',
      p0: 0.12,
      k: 0.00012,
    },
    {
      name: 'Moreneta Sable',
      emoji: '🗿',
      ticker: 'MSBL',
      description: '"Moreneta" evoca tradició i devoció; "Sable" hi afegeix una ombra d\'energia tallant. Podria ser personatge, marca o metàfora d\'una força discreta però contundent. No és contradicció, és equilibri amb caràcter.',
      p0: 0.18,
      k: 0.00018,
    },
    {
      name: 'Seny & Rauxa',
      emoji: '🧠',
      ticker: 'SRXA',
      description: 'El duet etern. El seny et diu que no enviïs aquell missatge a les tres de la matinada; la rauxa ja l\'ha enviat amb tres emoticones de foc. Prudència i impuls. Ordre i explosió. La gràcia és saber quan deixar parlar cadascun.',
      p0: 0.25,
      k: 0.00025,
    },
    {
      name: 'Caganer',
      emoji: '💩',
      ticker: 'CGNR',
      description: 'La prova que el sentit de l\'humor català no demana permís ni en el pessebre. Una figureta ajupida que recorda que fins i tot en escenes sagrades hi ha espai per la fisiologia. Amb els anys s\'ha modernitzat. Tothom pot acabar ajupit en miniatura.',
      p0: 0.08,
      k: 0.00008,
    },
    {
      name: 'Sardana Loop',
      emoji: '💃',
      ticker: 'TYET',
      description: 'La dansa tradicional repetint-se infinitament, com un gif cultural. Mans unides, passos comptats, rotllana que gira amb calma hipnòtica. El loop no és avorriment, és persistència.',
      p0: 0.22,
      k: 0.00022,
    },
    {
      name: 'Peatges 3.0',
      emoji: '💶',
      ticker: 'CARS',
      description: 'Sistema intel·ligent que et cobra abans que puguis parpellejar. Sense cabines, només sensors i notificacions bancàries. Darrere el 3.0 hi ha la discussió eterna sobre qui paga i per què.',
      p0: 0.30,
      k: 0.00030,
    },
    {
      name: 'Queta',
      emoji: '🏔️',
      ticker: 'QETA',
      description: 'Una boca que parla. Metàfora directa de fer servir una llengua. Sense distraccions. El missatge és clar: si tens boca, tens eina. Representa activació lingüística i responsabilitat individual.',
      p0: 0.50,
      k: 0.00050,
    },
  ];

  for (const product of products) {
    const created = await prisma.product.upsert({
      where: { ticker: product.ticker },
      update: {
        name: product.name,
        emoji: product.emoji,
        description: product.description,
        p0: product.p0,
        k: product.k,
      },
      create: {
        ...product,
        supply: 0,
        isActive: true,
        createdBy: adminId,
      },
    });

    // Crear AdminBuffer si no existeix
    await prisma.adminBuffer.upsert({
      where: { productId: created.id },
      update: {},
      create: {
        productId: created.id,
        fractions: 0,
        consolidatedEUR: 0,
      },
    });

    console.log(`✅ ${created.emoji} ${created.name} (${created.ticker}) — p0: ${created.p0}`);
  }

  console.log('');
  console.log('🎉 10 tokens creats correctament!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
