import { PrismaClient } from "../app/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Test1234!", 12);

  const engineer = await prisma.user.upsert({
    where: { email: "engineer@inspectai.dev" },
    update: {},
    create: {
      email: "engineer@inspectai.dev",
      name: "Test Engineer",
      passwordHash,
      role: "ENGINEER",
    },
  });

  await prisma.user.upsert({
    where: { email: "manager@inspectai.dev" },
    update: {},
    create: { email: "manager@inspectai.dev", name: "Test Manager", passwordHash, role: "MANAGER" },
  });

  await prisma.user.upsert({
    where: { email: "admin@inspectai.dev" },
    update: {},
    create: { email: "admin@inspectai.dev", name: "Test Admin", passwordHash, role: "ADMIN" },
  });

  console.log("Users created");

  const existingProjects = await prisma.project.findMany({
    where: { userId: engineer.id },
  });

  if (existingProjects.length > 0) {
    console.log("Demo data already exists, skipping...");
    return;
  }

  const demoImages = [
    "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800",
    "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800",
    "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800",
  ];

  const projects = [
    {
      name: "Golden Gate Bridge Span B",
      siteId: "SF-2991-X",
      objectType: "Bridge",
      address: "Golden Gate Bridge, San Francisco, CA",
      description: "Annual structural inspection of Span B concrete piers and deck surface. Focus on crack propagation monitoring and corrosion assessment.",
      status: "CRITICAL" as const,
    },
    {
      name: "Marina Tower Facade",
      siteId: "MT-2024-077",
      objectType: "Facade",
      address: "350 Marina Blvd, San Francisco, CA",
      description: "Post-construction facade inspection. Checking for surface cracks, delamination, and sealant integrity on precast concrete panels.",
      status: "ACTIVE" as const,
    },
    {
      name: "Pier 39 Concrete Assessment",
      siteId: "P39-2025-03",
      objectType: "Pier",
      address: "Pier 39, Embarcadero, San Francisco, CA",
      description: "Marine environment concrete assessment. Evaluating chloride penetration and spalling on support columns.",
      status: "ACTIVE" as const,
    },
  ];

  for (const p of projects) {
    const project = await prisma.project.create({
      data: {
        ...p,
        userId: engineer.id,
      },
    });
    console.log(`Created project: ${project.name}`);

    for (let i = 0; i < demoImages.length; i++) {
      const asset = await prisma.asset.create({
        data: {
          filename: `${project.siteId}_photo_${i + 1}.jpg`,
          blobUrl: demoImages[i],
          fileSize: 2400000 + i * 150000,
          mimeType: "image/jpeg",
          projectId: project.id,
        },
      });

      const analysis = await prisma.analysis.create({
        data: {
          status: "COMPLETED",
          confidence: 0.78 + i * 0.05,
          modelVersion: "YOLOv8-Ensemble-v2.1",
          userId: engineer.id,
          assetId: asset.id,
        },
      });

      const findingTypes = [
        { className: "Longitudinal Crack", severity: "CRITICAL" as const, confidence: 0.92, widthMm: 3.2, heightMm: 145.0, areaMm2: 464.0 },
        { className: "Surface Crack", severity: "HIGH" as const, confidence: 0.85, widthMm: 1.8, heightMm: 62.0, areaMm2: 111.6 },
        { className: "Hairline Crack", severity: "MEDIUM" as const, confidence: 0.71, widthMm: 0.5, heightMm: 28.0, areaMm2: 14.0 },
        { className: "Spalling", severity: "HIGH" as const, confidence: 0.88, widthMm: 45.0, heightMm: 30.0, areaMm2: 1350.0 },
        { className: "Efflorescence", severity: "LOW" as const, confidence: 0.65, widthMm: null, heightMm: null, areaMm2: null },
      ];

      const numFindings = i === 0 ? 4 : i === 1 ? 3 : 2;
      for (let f = 0; f < numFindings; f++) {
        const ft = findingTypes[f % findingTypes.length];
        await prisma.finding.create({
          data: {
            className: ft.className,
            confidence: ft.confidence,
            severity: ft.severity,
            bbox: { x: 100 + f * 50, y: 200 + f * 30, w: 80, h: 60 },
            widthMm: ft.widthMm,
            heightMm: ft.heightMm,
            areaMm2: ft.areaMm2,
            reviewStatus: f === 0 ? "CONFIRMED" : f === 1 ? "PENDING" : "CONFIRMED",
            reviewerNote: f === 0 && ft.severity === "CRITICAL" ? "Confirmed: crack extends through full thickness. Immediate repair required." : null,
            analysisId: analysis.id,
          },
        });
      }
    }

    await prisma.report.create({
      data: {
        title: `Inspection Report — ${project.name}`,
        summary: `${3 * (projects.indexOf(p) + 1)} defects found across ${demoImages.length} photos.`,
        projectId: project.id,
      },
    });
  }

  console.log("\nSeed complete! Demo data created:");
  console.log("  3 projects with 3 photos each");
  console.log("  9 analyses with ~27 findings");
  console.log("  3 reports");
  console.log("\nTest accounts:");
  console.log("  engineer@inspectai.dev / Test1234!");
  console.log("  manager@inspectai.dev  / Test1234!");
  console.log("  admin@inspectai.dev    / Test1234!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
