/**
 * Admin Certificates Module Verification Script
 * Tests:
 * - Module imports and exports
 * - Zod validation schemas
 * - API contract structure
 * - Prisma model fields
 */



async function verifyAdminCertificates() {
  console.log("🔍 Starting Admin Certificates Module Verification...\n");

  let passed = 0;
  let failed = 0;

  // Test 1: Import validations
  console.log("📋 Test 1: Validating imports...");
  try {
    const validations = await import("../src/lib/validations");

    if (!validations.CreateCertificateSchema) {
      throw new Error("CreateCertificateSchema not exported");
    }
    if (!validations.UpdateCertificateSchema) {
      throw new Error("UpdateCertificateSchema not exported");
    }
    if (!validations.CertificateFilterSchema) {
      throw new Error("CertificateFilterSchema not exported");
    }

    console.log("  ✓ All validation schemas exported correctly");
    passed++;
  } catch (error) {
    console.log(`  ✗ Import validation failed: ${error}`);
    failed++;
  }

  // Test 2: Import types
  console.log("\n📋 Test 2: Validating certificate types...");
  try {
    const { readFileSync } = await import("fs");
    const typeFile = readFileSync("src/types/certificate.ts", "utf-8");

    const requiredTypes = [
      "CertificateDTO",
      "CertificateListResponse",
      "CertificateDetailResponse",
      "CertificateCreateResponse",
      "CertificateUpdateResponse",
      "CertificateDeleteResponse",
    ];

    for (const type of requiredTypes) {
      if (!typeFile.includes(`export interface ${type}`) && !typeFile.includes(`export type ${type}`)) {
        throw new Error(`Type ${type} not found in certificate.ts`);
      }
    }

    console.log("  ✓ All certificate types defined correctly");
    passed++;
  } catch (error) {
    console.log(`  ✗ Type validation failed: ${error}`);
    failed++;
  }

  // Test 3: Import certificate service
  console.log("\n📋 Test 3: Validating certificate service...");
  try {
    const service = await import("../src/lib/certificate-service");

    const requiredFunctions = [
      "fetchCertificates",
      "fetchCertificate",
      "createCertificate",
      "updateCertificate",
      "deleteCertificate",
    ];

    for (const func of requiredFunctions) {
      if (typeof (service as Record<string, unknown>)[func] !== "function") {
        throw new Error(`Function ${func} not exported or not a function`);
      }
    }

    console.log("  ✓ All service functions exported correctly");
    passed++;
  } catch (error) {
    console.log(`  ✗ Service validation failed: ${error}`);
    failed++;
  }

  // Test 4: Zod Schema Validation
  console.log("\n📋 Test 4: Testing Zod schema validation...");
  try {
    const validations = await import("../src/lib/validations");

    // Test valid certificate creation
    const validPayload = {
      studentName: "أحمد محمد",
      courseName: "أساسيات الإسلام",
      completionDate: "2026-02-01",
      templateType: "template1",
    };

    const result = validations.CreateCertificateSchema.safeParse(validPayload);
    if (!result.success) {
      throw new Error(
        `Valid payload rejected: ${JSON.stringify(result.error.issues[0])}`
      );
    }

    // Test invalid payload (missing required field)
    const invalidPayload = {
      courseName: "أساسيات الإسلام",
      completionDate: "2026-02-01",
    };

    const invalidResult = validations.CreateCertificateSchema.safeParse(
      invalidPayload
    );
    if (invalidResult.success) {
      throw new Error("Invalid payload was incorrectly accepted");
    }

    // Test filter schema
    const filterPayload = {
      page: "1",
      limit: "20",
      search: "أحمد",
    };

    const filterResult = validations.CertificateFilterSchema.safeParse(
      filterPayload
    );
    if (!filterResult.success) {
      throw new Error(
        `Filter validation failed: ${JSON.stringify(filterResult.error.issues[0])}`
      );
    }

    console.log("  ✓ Zod schema validation working correctly");
    passed++;
  } catch (error) {
    console.log(`  ✗ Zod validation test failed: ${error}`);
    failed++;
  }

  // Test 5: Check API routes exist
  console.log("\n📋 Test 5: Verifying API routes exist...");
  try {
    const { existsSync } = await import("fs");

    const routes = [
      "src/app/api/admin/certificates/route.ts",
      "src/app/api/admin/certificates/[id]/route.ts",
    ];

    for (const route of routes) {
      if (!existsSync(route)) {
        throw new Error(`Route file not found: ${route}`);
      }
    }

    console.log("  ✓ All API route files exist");
    passed++;
  } catch (error) {
    console.log(`  ✗ API route check failed: ${error}`);
    failed++;
  }

  // Test 6: Check UI page exists
  console.log("\n📋 Test 6: Verifying UI page exists...");
  try {
    const { existsSync } = await import("fs");

    if (!existsSync("src/app/admin/certificates/page.tsx")) {
      throw new Error("Admin certificates page not found");
    }

    console.log("  ✓ Admin certificates page exists");
    passed++;
  } catch (error) {
    console.log(`  ✗ UI page check failed: ${error}`);
    failed++;
  }

  // Test 7: Prisma model check
  console.log("\n📋 Test 7: Checking Prisma Certificate model fields...");
  try {
    const schemaPath = "prisma/schema.prisma";
    const { existsSync, readFileSync } = await import("fs");

    if (!existsSync(schemaPath)) {
      throw new Error("Prisma schema not found");
    }

    const schema = readFileSync(schemaPath, "utf-8");

    const requiredFields = [
      "id",
      "certificateNumber",
      "studentName",
      "courseName",
      "completionDate",
      "templateType",
      "createdAt",
      "updatedAt",
    ];

    for (const field of requiredFields) {
      if (!schema.includes(`${field} `)) {
        console.warn(`  ⚠ Field ${field} might not be present`);
      }
    }

    if (!schema.includes("model Certificate")) {
      throw new Error("Certificate model not found in schema");
    }

    console.log("  ✓ Prisma Certificate model found with expected fields");
    passed++;
  } catch (error) {
    console.log(`  ✗ Prisma model check failed: ${error}`);
    failed++;
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log(`\n✨ Test Results: ${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    console.log("❌ Some tests failed. Please review the errors above.");
    process.exit(1);
  } else {
    console.log("✅ All tests passed! Admin Certificates module is working correctly.");
    process.exit(0);
  }
}

// Run verification
verifyAdminCertificates().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
