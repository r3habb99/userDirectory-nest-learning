#!/usr/bin/env ts-node

/**
 * API Documentation Generator
 * Generates comprehensive API documentation from Swagger/OpenAPI specs
 */

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../src/app.module';

interface ApiEndpoint {
  method: string;
  path: string;
  summary: string;
  description: string;
  tags: string[];
  parameters: any[];
  requestBody?: any;
  responses: any;
  security: any[];
}

interface ApiDocumentation {
  info: {
    title: string;
    description: string;
    version: string;
    contact: any;
    license: any;
  };
  servers: any[];
  tags: any[];
  endpoints: ApiEndpoint[];
  schemas: any;
}

class ApiDocumentationGenerator {
  private outputDir = join(process.cwd(), 'docs', 'api');

  async generate(): Promise<void> {
    console.log('🚀 Starting API documentation generation...');

    try {
      // Create NestJS application
      const app = await NestFactory.create(AppModule, { logger: false });

      // Setup Swagger
      const config = new DocumentBuilder()
        .setTitle('College Student Directory API')
        .setDescription(
          'A comprehensive API for managing college students, courses, attendance, and ID cards. ' +
          'This API allows administrators to manage student records, track attendance, generate ID cards, ' +
          'and manage course information.'
        )
        .setVersion('1.0.0')
        .setContact(
          'College Admin',
          'https://college-directory.example.com',
          'admin@college.edu'
        )
        .setLicense('MIT', 'https://opensource.org/licenses/MIT')
        .addServer('http://localhost:3000', 'Local Development Server')
        .addServer('https://api.college-directory.com', 'Production Server')
        .addBearerAuth(
          {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            name: 'JWT',
            description: 'Enter JWT token',
            in: 'header',
          },
          'JWT-auth'
        )
        .addTag('Authentication', 'Admin authentication endpoints')
        .addTag('Students', 'Student management endpoints')
        .addTag('Courses', 'Course management endpoints')
        .addTag('Attendance', 'Attendance management endpoints')
        .addTag('ID Cards', 'ID card generation and management endpoints')
        .addTag('Admin Management', 'Admin user management endpoints')
        .addTag('System', 'System health and information endpoints')
        .build();

      const document = SwaggerModule.createDocument(app, config, {
        deepScanRoutes: true,
        operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
      });

      // Ensure output directory exists
      if (!existsSync(this.outputDir)) {
        mkdirSync(this.outputDir, { recursive: true });
      }

      // Generate different formats
      await this.generateOpenApiSpec(document);
      await this.generateMarkdownDocs(document);
      await this.generatePostmanCollection(document);
      await this.generateApiReference(document);

      await app.close();
      console.log('✅ API documentation generated successfully!');
      console.log(`📁 Output directory: ${this.outputDir}`);

    } catch (error) {
      console.error('❌ Error generating API documentation:', error);
      process.exit(1);
    }
  }

  private async generateOpenApiSpec(document: any): Promise<void> {
    const outputPath = join(this.outputDir, 'openapi.json');
    writeFileSync(outputPath, JSON.stringify(document, null, 2));
    console.log(`📄 Generated OpenAPI spec: ${outputPath}`);

    // Also generate YAML version
    const yaml = require('js-yaml');
    const yamlPath = join(this.outputDir, 'openapi.yaml');
    writeFileSync(yamlPath, yaml.dump(document));
    console.log(`📄 Generated OpenAPI YAML: ${yamlPath}`);
  }

  private async generateMarkdownDocs(document: any): Promise<void> {
    const apiDoc = this.parseOpenApiDocument(document);
    const markdown = this.generateMarkdown(apiDoc);
    
    const outputPath = join(this.outputDir, 'README.md');
    writeFileSync(outputPath, markdown);
    console.log(`📝 Generated Markdown docs: ${outputPath}`);
  }

  private async generatePostmanCollection(document: any): Promise<void> {
    const collection = this.convertToPostmanCollection(document);
    const outputPath = join(this.outputDir, 'postman-collection.json');
    writeFileSync(outputPath, JSON.stringify(collection, null, 2));
    console.log(`📮 Generated Postman collection: ${outputPath}`);
  }

  private async generateApiReference(document: any): Promise<void> {
    const apiDoc = this.parseOpenApiDocument(document);
    const html = this.generateHtmlReference(apiDoc);
    
    const outputPath = join(this.outputDir, 'api-reference.html');
    writeFileSync(outputPath, html);
    console.log(`🌐 Generated HTML reference: ${outputPath}`);
  }

  private parseOpenApiDocument(document: any): ApiDocumentation {
    const endpoints: ApiEndpoint[] = [];

    for (const [path, pathItem] of Object.entries(document.paths)) {
      for (const [method, operation] of Object.entries(pathItem as any)) {
        if (typeof operation === 'object' && operation !== null) {
          endpoints.push({
            method: method.toUpperCase(),
            path,
            summary: operation.summary || '',
            description: operation.description || '',
            tags: operation.tags || [],
            parameters: operation.parameters || [],
            requestBody: operation.requestBody,
            responses: operation.responses || {},
            security: operation.security || [],
          });
        }
      }
    }

    return {
      info: document.info,
      servers: document.servers || [],
      tags: document.tags || [],
      endpoints,
      schemas: document.components?.schemas || {},
    };
  }

  private generateMarkdown(apiDoc: ApiDocumentation): string {
    let markdown = `# ${apiDoc.info.title}\n\n`;
    markdown += `${apiDoc.info.description}\n\n`;
    markdown += `**Version:** ${apiDoc.info.version}\n\n`;

    if (apiDoc.info.contact) {
      markdown += `**Contact:** [${apiDoc.info.contact.name}](${apiDoc.info.contact.url}) - ${apiDoc.info.contact.email}\n\n`;
    }

    // Table of Contents
    markdown += `## Table of Contents\n\n`;
    const tagGroups = this.groupEndpointsByTag(apiDoc.endpoints);
    for (const tag of Object.keys(tagGroups)) {
      markdown += `- [${tag}](#${tag.toLowerCase().replace(/\s+/g, '-')})\n`;
    }
    markdown += `\n`;

    // Authentication
    markdown += `## Authentication\n\n`;
    markdown += `This API uses JWT Bearer token authentication. Include the token in the Authorization header:\n\n`;
    markdown += `\`\`\`\nAuthorization: Bearer <your-jwt-token>\n\`\`\`\n\n`;

    // Base URLs
    markdown += `## Base URLs\n\n`;
    for (const server of apiDoc.servers) {
      markdown += `- **${server.description}:** \`${server.url}\`\n`;
    }
    markdown += `\n`;

    // Endpoints by tag
    for (const [tag, endpoints] of Object.entries(tagGroups)) {
      markdown += `## ${tag}\n\n`;
      
      for (const endpoint of endpoints) {
        markdown += `### ${endpoint.method} ${endpoint.path}\n\n`;
        markdown += `${endpoint.summary}\n\n`;
        
        if (endpoint.description) {
          markdown += `${endpoint.description}\n\n`;
        }

        // Parameters
        if (endpoint.parameters.length > 0) {
          markdown += `**Parameters:**\n\n`;
          markdown += `| Name | Type | Required | Description |\n`;
          markdown += `|------|------|----------|-------------|\n`;
          
          for (const param of endpoint.parameters) {
            const required = param.required ? 'Yes' : 'No';
            markdown += `| ${param.name} | ${param.schema?.type || 'string'} | ${required} | ${param.description || ''} |\n`;
          }
          markdown += `\n`;
        }

        // Request Body
        if (endpoint.requestBody) {
          markdown += `**Request Body:**\n\n`;
          markdown += `\`\`\`json\n`;
          markdown += `${JSON.stringify(endpoint.requestBody.content?.['application/json']?.example || {}, null, 2)}\n`;
          markdown += `\`\`\`\n\n`;
        }

        // Responses
        markdown += `**Responses:**\n\n`;
        for (const [statusCode, response] of Object.entries(endpoint.responses)) {
          markdown += `- **${statusCode}:** ${(response as any).description}\n`;
        }
        markdown += `\n`;
      }
    }

    return markdown;
  }

  private generateHtmlReference(apiDoc: ApiDocumentation): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${apiDoc.info.title} - API Reference</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { border-bottom: 1px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
        .endpoint { border: 1px solid #ddd; border-radius: 8px; margin-bottom: 20px; overflow: hidden; }
        .endpoint-header { background: #f8f9fa; padding: 15px; border-bottom: 1px solid #ddd; }
        .endpoint-body { padding: 20px; }
        .method { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; color: white; }
        .method.get { background: #28a745; }
        .method.post { background: #007bff; }
        .method.put { background: #ffc107; color: #212529; }
        .method.patch { background: #17a2b8; }
        .method.delete { background: #dc3545; }
        .path { font-family: monospace; font-size: 16px; margin-left: 10px; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f8f9fa; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${apiDoc.info.title}</h1>
            <p>${apiDoc.info.description}</p>
            <p><strong>Version:</strong> ${apiDoc.info.version}</p>
        </div>
        
        ${this.generateEndpointHtml(apiDoc.endpoints)}
    </div>
</body>
</html>`;
  }

  private generateEndpointHtml(endpoints: ApiEndpoint[]): string {
    return endpoints.map(endpoint => `
        <div class="endpoint">
            <div class="endpoint-header">
                <span class="method ${endpoint.method.toLowerCase()}">${endpoint.method}</span>
                <span class="path">${endpoint.path}</span>
            </div>
            <div class="endpoint-body">
                <h3>${endpoint.summary}</h3>
                ${endpoint.description ? `<p>${endpoint.description}</p>` : ''}
                
                ${endpoint.parameters.length > 0 ? `
                <h4>Parameters</h4>
                <table>
                    <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
                    ${endpoint.parameters.map(param => `
                        <tr>
                            <td>${param.name}</td>
                            <td>${param.schema?.type || 'string'}</td>
                            <td>${param.required ? 'Yes' : 'No'}</td>
                            <td>${param.description || ''}</td>
                        </tr>
                    `).join('')}
                </table>
                ` : ''}
                
                <h4>Responses</h4>
                <ul>
                    ${Object.entries(endpoint.responses).map(([code, response]) => 
                        `<li><strong>${code}:</strong> ${(response as any).description}</li>`
                    ).join('')}
                </ul>
            </div>
        </div>
    `).join('');
  }

  private convertToPostmanCollection(document: any): any {
    // Basic Postman collection structure
    return {
      info: {
        name: document.info.title,
        description: document.info.description,
        version: document.info.version,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      auth: {
        type: 'bearer',
        bearer: [{ key: 'token', value: '{{jwt_token}}', type: 'string' }],
      },
      variable: [
        { key: 'base_url', value: 'http://localhost:3000', type: 'string' },
        { key: 'jwt_token', value: '', type: 'string' },
      ],
      item: this.generatePostmanItems(document.paths),
    };
  }

  private generatePostmanItems(paths: any): any[] {
    const items: any[] = [];
    
    for (const [path, pathItem] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(pathItem as any)) {
        if (typeof operation === 'object' && operation !== null) {
          items.push({
            name: operation.summary || `${method.toUpperCase()} ${path}`,
            request: {
              method: method.toUpperCase(),
              header: [
                { key: 'Content-Type', value: 'application/json' },
                { key: 'Authorization', value: 'Bearer {{jwt_token}}' },
              ],
              url: {
                raw: '{{base_url}}' + path,
                host: ['{{base_url}}'],
                path: path.split('/').filter(Boolean),
              },
              body: operation.requestBody ? {
                mode: 'raw',
                raw: JSON.stringify(operation.requestBody.content?.['application/json']?.example || {}, null, 2),
              } : undefined,
            },
          });
        }
      }
    }
    
    return items;
  }

  private groupEndpointsByTag(endpoints: ApiEndpoint[]): Record<string, ApiEndpoint[]> {
    const groups: Record<string, ApiEndpoint[]> = {};
    
    for (const endpoint of endpoints) {
      const tag = endpoint.tags[0] || 'Other';
      if (!groups[tag]) {
        groups[tag] = [];
      }
      groups[tag].push(endpoint);
    }
    
    return groups;
  }
}

// Run the generator
if (require.main === module) {
  const generator = new ApiDocumentationGenerator();
  generator.generate().catch(console.error);
}

export { ApiDocumentationGenerator };
