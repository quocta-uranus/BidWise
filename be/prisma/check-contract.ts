import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const contract = await prisma.contract.findFirst({
    where: {
      job: {
        title: {
          contains: 'shopping',
          mode: 'insensitive'
        }
      }
    },
    include: {
      milestones: true,
      job: true
    }
  });

  if (!contract) {
    console.log('No contract found with job title containing "shopping"');
    return;
  }

  console.log('Contract found:');
  console.log(JSON.stringify(contract, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
