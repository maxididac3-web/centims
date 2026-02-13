const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrant productes inicials...');

  const products = [
    {
      name: 'Renfe Executive Delay',
      emoji: '🚄',
      description: 'El retard premium de la alta velocitat catalana',
      p0: 0.10,
      k: 0.0001,
    },
    {
      name: 'Calçot 4K',
      emoji: '🧅',
      description: 'Calçotada en ultra alta definició',
      p0: 0.15,
      k: 0.00015,
    },
    {
      name: "Omilies d'Organyà",
      emoji: '⛪',
      description: 'El sermó més antic en català',
      p0: 0.20,
      k: 0.0002,
    },
    {
      name: 'Yamin Lamal',
      emoji: '⚽',
      description: 'La joia del Barça',
      p0: 0.12,
      k: 0.00012,
    },
    {
      name: 'Moreneta Sable',
      emoji: '🗿',
      description: 'La patrona guerrera de Montserrat',
      p0: 0.18,
      k: 0.00018,
    },
    {
      name: 'Seny & Rauxa',
      emoji: '🧠',
      description: "L'equilibri perfecte de l'esperit català",
      p0: 0.25,
      k: 0.00025,
    },
    {
      name: 'Caganer',
      emoji: '💩',
      description: 'El clàssic nadalenc que fertilitza la prosperitat',
      p0: 0.08,
      k: 0.00008,
    },
    {
      name: 'Sardana Loop',
      emoji: '💃',
      description: 'La dansa circular infinita',
      p0: 0.22,
      k: 0.00022,
    },
    {
      name: 'Peatges 3.0',
      emoji: '💶',
      description: "L'autopista digital amb barrera incluïda",
      p0: 0.30,
      k: 0.0003,
    },
    {
      name: 'Queta',
      emoji: '🏔️',
      description: 'La muntanya sagrada dels sommits',
      p0: 0.50,
      k: 0.0005,
    },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
    console.log(`✅ Creat: ${product.emoji} ${product.name}`);
  }

  console.log('🎉 Productes creats correctament!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });