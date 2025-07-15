import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIdCardDto } from '../../dto/id-card/create-id-card.dto';
import { ResponseUtils } from '../../common/utils/response.utils';
import {
  ApiResponse,
  PaginatedResponse,
} from '../../common/interfaces/api-response.interface';
import { Student, Course } from '@prisma/client';
// QR code generation library
import * as QRCode from 'qrcode';
import { createCanvas, loadImage } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';

// Type definitions for Prisma relations
type StudentWithCourse = Student & {
  course: Course;
};

@Injectable()
export class IdCardService {
  private readonly logger = new Logger(IdCardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate ID card for a student
   */
  async generateIdCard(createIdCardDto: CreateIdCardDto): Promise<ApiResponse> {
    try {
      const { studentId, expiryDate } = createIdCardDto;

      // Check if student exists
      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
        include: { course: true },
      });

      if (!student) {
        throw new BadRequestException('Student not found');
      }

      // Check if active ID card already exists
      const existingIdCard = await this.prisma.idCard.findFirst({
        where: {
          studentId,
          isActive: true,
        },
      });

      if (existingIdCard) {
        throw new BadRequestException(
          'Active ID card already exists for this student',
        );
      }

      // Generate card number
      const cardNumber = await this.generateCardNumber();

      // Generate QR code data
      const qrCodeData = JSON.stringify({
        studentId: student.id,
        enrollmentNumber: student.enrollmentNumber,
        name: student.name,
        course: student.course.type,
        cardNumber,
        issueDate: new Date().toISOString(),
      });

      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(qrCodeData, {
        width: 200,
        margin: 2,
      });

      // Generate ID card image
      const cardImageUrl = await this.generateIdCardImage(
        student,
        cardNumber,
        qrCodeDataUrl,
      );

      // Create ID card record
      const idCard = await this.prisma.idCard.create({
        data: {
          studentId,
          cardNumber,
          expiryDate: new Date(expiryDate),
          qrCode: qrCodeData,
          cardImageUrl,
        },
        include: {
          student: {
            include: { course: true },
          },
        },
      });

      return ResponseUtils.success(idCard, 'ID card generated successfully');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.stack : 'Unknown error';
      this.logger.error('Failed to generate ID card', errorMessage);
      throw error;
    }
  }

  /**
   * Get all ID cards with pagination
   */
  async findAll(
    page = 1,
    limit = 10,
    isActive?: boolean,
  ): Promise<PaginatedResponse> {
    try {
      const skip = (page - 1) * limit;
      const where: { isActive?: boolean } = {};

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      const [idCards, total] = await Promise.all([
        this.prisma.idCard.findMany({
          where,
          skip,
          take: limit,
          include: {
            student: {
              include: { course: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.idCard.count({ where }),
      ]);

      return ResponseUtils.paginated(
        idCards,
        total,
        page,
        limit,
        'ID cards retrieved successfully',
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.stack : 'Unknown error';
      this.logger.error('Failed to retrieve ID cards', errorMessage);
      throw error;
    }
  }

  /**
   * Get ID card by ID
   */
  async findOne(id: string): Promise<ApiResponse> {
    try {
      const idCard = await this.prisma.idCard.findUnique({
        where: { id },
        include: {
          student: {
            include: { course: true },
          },
        },
      });

      if (!idCard) {
        return ResponseUtils.notFound('ID card not found');
      }

      return ResponseUtils.success(idCard, 'ID card retrieved successfully');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.stack : 'Unknown error';
      this.logger.error(
        `Failed to retrieve ID card with ID: ${id}`,
        errorMessage,
      );
      throw error;
    }
  }

  /**
   * Get ID card by student ID
   */
  async findByStudentId(studentId: string): Promise<ApiResponse> {
    try {
      const idCard = await this.prisma.idCard.findFirst({
        where: {
          studentId,
          isActive: true,
        },
        include: {
          student: {
            include: { course: true },
          },
        },
      });

      if (!idCard) {
        return ResponseUtils.notFound(
          'Active ID card not found for this student',
        );
      }

      return ResponseUtils.success(idCard, 'ID card retrieved successfully');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.stack : 'Unknown error';
      this.logger.error(
        `Failed to retrieve ID card for student: ${studentId}`,
        errorMessage,
      );
      throw error;
    }
  }

  /**
   * Deactivate ID card
   */
  async deactivateIdCard(id: string): Promise<ApiResponse> {
    try {
      const idCard = await this.prisma.idCard.findUnique({
        where: { id },
      });

      if (!idCard) {
        return ResponseUtils.notFound('ID card not found');
      }

      const updatedIdCard = await this.prisma.idCard.update({
        where: { id },
        data: { isActive: false },
        include: {
          student: {
            include: { course: true },
          },
        },
      });

      return ResponseUtils.success(
        updatedIdCard,
        'ID card deactivated successfully',
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.stack : 'Unknown error';
      this.logger.error(
        `Failed to deactivate ID card with ID: ${id}`,
        errorMessage,
      );
      throw error;
    }
  }

  /**
   * Generate unique card number
   */
  private async generateCardNumber(): Promise<string> {
    const year = new Date().getFullYear();
    let cardNumber: string = '';
    let isUnique = false;

    while (!isUnique) {
      const randomNum = Math.floor(Math.random() * 900000) + 100000; // 6-digit random number
      cardNumber = `ID${year}${randomNum}`;

      const existingCard = await this.prisma.idCard.findUnique({
        where: { cardNumber },
      });

      if (!existingCard) {
        isUnique = true;
      }
    }

    return cardNumber;
  }

  /**
   * Generate ID card image
   */
  private async generateIdCardImage(
    student: StudentWithCourse,
    cardNumber: string,
    qrCodeDataUrl: string,
  ): Promise<string> {
    try {
      // Create canvas for ID card (standard ID card size: 85.6mm x 53.98mm at 300 DPI)
      const width = 1012; // 85.6mm at 300 DPI
      const height = 638; // 53.98mm at 300 DPI
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Header background
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(0, 0, width, 120);

      // College name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('COLLEGE NAME', width / 2, 50);

      ctx.font = '24px Arial';
      ctx.fillText('Student ID Card', width / 2, 85);

      // Student photo placeholder (you can replace this with actual photo loading)
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(50, 150, 150, 180);
      ctx.fillStyle = '#6b7280';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PHOTO', 125, 250);

      // Student information
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('Name:', 230, 180);
      ctx.font = '20px Arial';
      ctx.fillText(student.name, 230, 210);

      ctx.font = 'bold 20px Arial';
      ctx.fillText('Enrollment:', 230, 250);
      ctx.font = '18px Arial';
      ctx.fillText(student.enrollmentNumber, 230, 280);

      ctx.font = 'bold 20px Arial';
      ctx.fillText('Course:', 230, 320);
      ctx.font = '18px Arial';
      ctx.fillText(`${student.course.name} (${student.course.type})`, 230, 350);

      ctx.font = 'bold 20px Arial';
      ctx.fillText('Card No:', 230, 390);
      ctx.font = '18px Arial';
      ctx.fillText(cardNumber, 230, 420);

      // QR Code
      const qrImage = await loadImage(qrCodeDataUrl);
      ctx.drawImage(qrImage, width - 180, height - 180, 150, 150);

      // Footer
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        `Valid until: ${new Date().getFullYear() + 4}`,
        width / 2,
        height - 20,
      );

      // Save image
      const uploadsDir = path.join(process.cwd(), 'uploads', 'id-cards');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileName = `id-card-${student.enrollmentNumber}-${Date.now()}.png`;
      const filePath = path.join(uploadsDir, fileName);
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(filePath, buffer);

      return `/uploads/id-cards/${fileName}`;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.stack : 'Unknown error';
      this.logger.error('Failed to generate ID card image', errorMessage);
      throw new Error('Failed to generate ID card image');
    }
  }
}
