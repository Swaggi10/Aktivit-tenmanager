import prisma from '../config/database';
import { TeamType, Role, AchievementType } from '@prisma/client';
import { logger } from '../utils/logger';

/**
 * Datenbank mit Initialdaten befüllen
 */
async function seed() {
  logger.info('🌱 Starting database seed...');

  try {
    // 1. Teams erstellen
    logger.info('Creating teams...');

    const teams = await Promise.all([
      prisma.team.upsert({
        where: { type: TeamType.LEADGEN_MAIL },
        update: {},
        create: {
          name: 'LeadGen + Mailakquise',
          type: TeamType.LEADGEN_MAIL,
          description: 'Team für Lead-Generierung und E-Mail-Akquise',
          color: '#3B82F6',
          maxCapacity: 5.0,
        },
      }),
      prisma.team.upsert({
        where: { type: TeamType.AKQUISE },
        update: {},
        create: {
          name: 'Akquise',
          type: TeamType.AKQUISE,
          description: 'Team für allgemeine Akquise-Aktivitäten',
          color: '#10B981',
          maxCapacity: 5.0,
        },
      }),
      prisma.team.upsert({
        where: { type: TeamType.SALES_DEV },
        update: {},
        create: {
          name: 'Sales Development',
          type: TeamType.SALES_DEV,
          description: 'Team für Sales Development',
          color: '#F59E0B',
          maxCapacity: 5.0,
        },
      }),
    ]);

    logger.info(`✓ Created ${teams.length} teams`);

    // 2. Demo-User erstellen
    logger.info('Creating demo users...');

    const demoUsers = await Promise.all([
      // Demo Admin
      prisma.user.upsert({
        where: { email: 'admin@demo.com' },
        update: {},
        create: {
          email: 'admin@demo.com',
          name: 'Max Mustermann (Admin)',
          role: Role.ADMIN,
          teamId: teams[0].id, // LeadGen + Mailakquise
          totalPoints: 1250,
          level: 5,
        },
      }),
      // Demo Team Leader
      prisma.user.upsert({
        where: { email: 'teamleader@demo.com' },
        update: {},
        create: {
          email: 'teamleader@demo.com',
          name: 'Anna Schmidt (Team Leader)',
          role: Role.TEAM_LEADER,
          teamId: teams[1].id, // Akquise
          totalPoints: 850,
          level: 4,
        },
      }),
      // Demo Member
      prisma.user.upsert({
        where: { email: 'member@demo.com' },
        update: {},
        create: {
          email: 'member@demo.com',
          name: 'Tom Wagner (Member)',
          role: Role.MEMBER,
          teamId: teams[2].id, // Sales Development
          totalPoints: 420,
          level: 2,
        },
      }),
      // Weitere Demo-Mitarbeiter für realistischeres Leaderboard
      prisma.user.upsert({
        where: { email: 'sarah@demo.com' },
        update: {},
        create: {
          email: 'sarah@demo.com',
          name: 'Sarah Müller',
          role: Role.MEMBER,
          teamId: teams[0].id,
          totalPoints: 680,
          level: 3,
        },
      }),
      prisma.user.upsert({
        where: { email: 'michael@demo.com' },
        update: {},
        create: {
          email: 'michael@demo.com',
          name: 'Michael Becker',
          role: Role.MEMBER,
          teamId: teams[1].id,
          totalPoints: 920,
          level: 4,
        },
      }),
      prisma.user.upsert({
        where: { email: 'lisa@demo.com' },
        update: {},
        create: {
          email: 'lisa@demo.com',
          name: 'Lisa Hoffmann',
          role: Role.MEMBER,
          teamId: teams[2].id,
          totalPoints: 340,
          level: 2,
        },
      }),
    ]);

    logger.info(`✓ Created ${demoUsers.length} demo users`);
    logger.info('  - admin@demo.com (Admin, 1250 Punkte)');
    logger.info('  - teamleader@demo.com (Team Leader, 850 Punkte)');
    logger.info('  - member@demo.com (Member, 420 Punkte)');

    // 3. Achievements erstellen
    logger.info('Creating achievements...');

    const achievements = [
      {
        type: AchievementType.FIRST_TASK,
        name: 'Erste Schritte',
        description: 'Deine erste Aufgabe abgeschlossen',
        icon: '🎯',
        pointsReward: 10,
      },
      {
        type: AchievementType.TASK_STREAK_5,
        name: 'Im Flow',
        description: '5 Aufgaben hintereinander vor der Deadline abgeschlossen',
        icon: '🔥',
        pointsReward: 50,
      },
      {
        type: AchievementType.TASK_STREAK_10,
        name: 'Unaufhaltsam',
        description: '10 Aufgaben hintereinander vor der Deadline abgeschlossen',
        icon: '⚡',
        pointsReward: 100,
      },
      {
        type: AchievementType.TEAM_PLAYER,
        name: 'Team Player',
        description: '10 hilfreiche Kommentare mit @mentions',
        icon: '🤝',
        pointsReward: 75,
      },
      {
        type: AchievementType.SPEED_DEMON,
        name: 'Blitzschnell',
        description: '10 Aufgaben unter der geschätzten Zeit abgeschlossen',
        icon: '💨',
        pointsReward: 80,
      },
      {
        type: AchievementType.PERFECTIONIST,
        name: 'Perfektionist',
        description: '20 Aufgaben ohne Revision abgeschlossen',
        icon: '✨',
        pointsReward: 100,
      },
      {
        type: AchievementType.EARLY_BIRD,
        name: 'Früher Vogel',
        description: '15 Aufgaben 3+ Tage vor der Deadline abgeschlossen',
        icon: '🐦',
        pointsReward: 90,
      },
      {
        type: AchievementType.TEAM_LEADER_MONTH,
        name: 'Team Champion',
        description: 'Dein Team war #1 diesen Monat',
        icon: '🏆',
        pointsReward: 200,
      },
      {
        type: AchievementType.CENTURY,
        name: 'Jahrhundert',
        description: '100 Aufgaben abgeschlossen',
        icon: '💯',
        pointsReward: 150,
      },
      {
        type: AchievementType.LEGEND,
        name: 'Legende',
        description: '1000 Punkte erreicht',
        icon: '👑',
        pointsReward: 500,
      },
    ];

    for (const achievement of achievements) {
      await prisma.achievement.upsert({
        where: { type: achievement.type },
        update: {},
        create: achievement,
      });
    }

    logger.info(`✓ Created ${achievements.length} achievements`);

    logger.info('✅ Database seed completed successfully!');
    logger.info('\n📝 Next steps:');
    logger.info('1. Start the server: npm run dev');
    logger.info('2. Open: http://localhost:3000');
    logger.info('\n🎮 Demo Mode available!');
    logger.info('  Login with: admin@demo.com (Admin)');
    logger.info('  Login with: teamleader@demo.com (Team Leader)');
    logger.info('  Login with: member@demo.com (Member)');
  } catch (error) {
    logger.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Seed ausführen
seed()
  .catch((error) => {
    logger.error('Seed failed:', error);
    process.exit(1);
  });
