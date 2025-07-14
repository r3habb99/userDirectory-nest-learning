import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default admin
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  const admin = await prisma.admin.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      password: hashedPassword,
      name: 'System Administrator',
      phone: '+9265072377',
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Created admin:', admin.email);

  // Create courses
  const courses = [
    {
      name: 'Bachelor of Computer Applications',
      type: 'BCA',
      duration: 3,
      description:
        'A 3-year undergraduate program in computer applications covering programming, database management, and software development.',
    },
    {
      name: 'Master of Computer Applications',
      type: 'MCA',
      duration: 2,
      description:
        'A 2-year postgraduate program in computer applications with advanced topics in software engineering and system design.',
    },
    {
      name: 'Bachelor of Business Administration',
      type: 'BBA',
      duration: 3,
      description:
        'A 3-year undergraduate program in business administration covering management, marketing, and finance.',
    },
    {
      name: 'Master of Business Administration',
      type: 'MBA',
      duration: 2,
      description:
        'A 2-year postgraduate program in business administration with specializations in various business domains.',
    },
    {
      name: 'Bachelor of Commerce',
      type: 'BCOM',
      duration: 3,
      description:
        'A 3-year undergraduate program in commerce covering accounting, economics, and business studies.',
    },
    {
      name: 'Master of Commerce',
      type: 'MCOM',
      duration: 2,
      description:
        'A 2-year postgraduate program in commerce with advanced topics in accounting and business management.',
    },
  ];

  for (const courseData of courses) {
    const course = await prisma.course.upsert({
      where: { type: courseData.type as any },
      update: {},
      create: courseData as any,
    });
    console.log(`✅ Created course: ${course.name} (${course.type})`);
  }

  // Create sample students
  const bcaCourse = await prisma.course.findUnique({ where: { type: 'BCA' } });
  const mcaCourse = await prisma.course.findUnique({ where: { type: 'MCA' } });

  if (bcaCourse && mcaCourse) {
    const sampleStudents = [
      {
        name: 'Rahul Sharma',
        email: 'rahul.sharma@student.com',
        phone: '+919876543210',
        age: 20,
        gender: 'MALE',
        address: '123 Main Street, Mumbai, Maharashtra, India',
        admissionYear: 2024,
        passoutYear: 2027,
        courseId: bcaCourse.id,
        createdBy: admin.id,
      },
      {
        name: 'Priya Patel',
        email: 'priya.patel@student.com',
        phone: '+919876543211',
        age: 19,
        gender: 'FEMALE',
        address: '456 Park Avenue, Delhi, India',
        admissionYear: 2024,
        passoutYear: 2027,
        courseId: bcaCourse.id,
        createdBy: admin.id,
      },
      {
        name: 'Amit Kumar',
        email: 'amit.kumar@student.com',
        phone: '+919876543212',
        age: 22,
        gender: 'MALE',
        address: '789 Garden Road, Bangalore, Karnataka, India',
        admissionYear: 2024,
        passoutYear: 2026,
        courseId: mcaCourse.id,
        createdBy: admin.id,
      },
    ];

    // Generate enrollment numbers and create students
    for (let i = 0; i < sampleStudents.length; i++) {
      const student = sampleStudents[i];

      // Get or create enrollment counter
      const course = await prisma.course.findUnique({
        where: { id: student.courseId },
      });
      if (!course) continue;

      const counter = await prisma.enrollmentCounter.upsert({
        where: {
          courseType_year: {
            courseType: course.type,
            year: student.admissionYear,
          },
        },
        update: {
          lastNumber: { increment: 1 },
        },
        create: {
          courseType: course.type,
          year: student.admissionYear,
          lastNumber: 1,
        },
      });

      const enrollmentNumber = `${student.admissionYear}${course.type}${counter.lastNumber.toString().padStart(3, '0')}`;

      const createdStudent = await prisma.student.create({
        data: {
          ...student,
          enrollmentNumber,
        } as any,
      });

      console.log(
        `✅ Created student: ${createdStudent.name} (${createdStudent.enrollmentNumber})`,
      );
    }
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
