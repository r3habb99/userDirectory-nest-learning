import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { StudentService } from './student.service';
import { PrismaService } from '../prisma/prisma.service';
import { EnrollmentService } from '../enrollment/enrollment.service';
import { CreateStudentDto } from '../../dto/student/create-student.dto';
import { UpdateStudentDto } from '../../dto/student/update-student.dto';

describe('StudentService', () => {
  let service: StudentService;
  let prismaService: PrismaService;
  let enrollmentService: EnrollmentService;

  const mockPrismaService = {
    student: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
    },
  };

  const mockEnrollmentService = {
    generateEnrollmentNumber: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EnrollmentService,
          useValue: mockEnrollmentService,
        },
      ],
    }).compile();

    service = module.get<StudentService>(StudentService);
    prismaService = module.get<PrismaService>(PrismaService);
    enrollmentService = module.get<EnrollmentService>(EnrollmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createStudentDto: CreateStudentDto = {
      name: 'John Doe',
      email: 'john@test.com',
      phone: '1234567890',
      address: '123 Main St',
      age: 20,
      gender: 'MALE' as any,
      courseId: 'course-1',
      admissionYear: 2023,
      passoutYear: 2026,
    };

    const mockCourse = {
      id: 'course-1',
      name: 'Bachelor of Computer Applications',
      type: 'BCA',
    };

    const mockStudent = {
      id: 'student-1',
      ...createStudentDto,
      enrollmentNumber: '2023BCA001',
      course: mockCourse,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create student successfully', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
      mockEnrollmentService.generateEnrollmentNumber.mockResolvedValue(
        '2023BCA001',
      );
      mockPrismaService.student.create.mockResolvedValue(mockStudent);

      const result = await service.create(createStudentDto, 'admin-1');

      expect(result.success).toBe(true);
      expect(result.data.enrollmentNumber).toBe('2023BCA001');
      expect(
        mockEnrollmentService.generateEnrollmentNumber,
      ).toHaveBeenCalledWith(mockCourse.type, createStudentDto.admissionYear);
    });

    it('should throw BadRequestException if course not found', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(null);

      await expect(service.create(createStudentDto, 'admin-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    const mockStudents = [
      {
        id: 'student-1',
        name: 'John Doe',
        enrollmentNumber: '2023BCA001',
        course: { name: 'BCA', type: 'BCA' },
      },
    ];

    it('should return paginated students', async () => {
      mockPrismaService.student.findMany.mockResolvedValue(mockStudents);
      mockPrismaService.student.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStudents);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('findOne', () => {
    const mockStudent = {
      id: 'student-1',
      name: 'John Doe',
      enrollmentNumber: '2023BCA001',
      course: { name: 'BCA', type: 'BCA' },
    };

    it('should return student by ID', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(mockStudent);

      const result = await service.findOne('student-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStudent);
    });

    it('should return not found if student does not exist', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(null);

      const result = await service.findOne('non-existent');

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(404);
    });
  });

  describe('update', () => {
    const updateStudentDto: UpdateStudentDto = {
      name: 'John Updated',
      phone: '9876543210',
    };

    const mockStudent = {
      id: 'student-1',
      name: 'John Doe',
      enrollmentNumber: '2023BCA001',
    };

    const mockUpdatedStudent = {
      ...mockStudent,
      ...updateStudentDto,
    };

    it('should update student successfully', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(mockStudent);
      mockPrismaService.student.update.mockResolvedValue(mockUpdatedStudent);

      const result = await service.update('student-1', updateStudentDto);

      expect(result.success).toBe(true);
      expect(result.data.name).toBe(updateStudentDto.name);
    });

    it('should return not found if student does not exist', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(null);

      const result = await service.update('non-existent', updateStudentDto);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(404);
    });
  });

  describe('remove', () => {
    const mockStudent = {
      id: 'student-1',
      name: 'John Doe',
    };

    it('should delete student successfully', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(mockStudent);
      mockPrismaService.student.delete.mockResolvedValue(mockStudent);

      const result = await service.remove('student-1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Student deleted successfully');
    });

    it('should return not found if student does not exist', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(null);

      const result = await service.remove('non-existent');

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(404);
    });
  });
});
