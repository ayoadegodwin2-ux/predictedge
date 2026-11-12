import { verifyAdminToken, isRequestAdminAuthorized, getConfiguredAdminPassword } from "../src/lib/admin-auth";

console.log("🔐 Testing Admin Auth Functions...\n");

const configuredPassword = getConfiguredAdminPassword();
console.log(`Configured password: "${configuredPassword}"`);

// 1. Raw password verification
const test1 = verifyAdminToken(configuredPassword);
console.log(`1. Raw password verify: ${test1 ? "✅ PASS" : "❌ FAIL"}`);

// 2. Bearer raw password
const test2 = verifyAdminToken(`Bearer ${configuredPassword}`);
console.log(`2. Bearer raw password: ${test2 ? "✅ PASS" : "❌ FAIL"}`);

// 3. Base64 token
const b64Token = Buffer.from(`admin:${Date.now()}:${configuredPassword}`).toString("base64");
const test3 = verifyAdminToken(b64Token);
console.log(`3. Base64 token verify: ${test3 ? "✅ PASS" : "❌ FAIL"}`);

// 4. Request with x-admin-token header (raw password)
const req1 = new Request("http://localhost:3000/api/admin/trigger", {
  method: "POST",
  headers: { "x-admin-token": configuredPassword },
});
const test4 = isRequestAdminAuthorized(req1);
console.log(`4. Request with x-admin-token (raw): ${test4 ? "✅ PASS" : "❌ FAIL"}`);

// 5. Request with Authorization: Bearer <password>
const req2 = new Request("http://localhost:3000/api/admin/trigger", {
  method: "POST",
  headers: { authorization: `Bearer ${configuredPassword}` },
});
const test5 = isRequestAdminAuthorized(req2);
console.log(`5. Request with Bearer header: ${test5 ? "✅ PASS" : "❌ FAIL"}`);

// 6. Request with password in JSON body
const req3 = new Request("http://localhost:3000/api/admin/trigger", {
  method: "POST",
  headers: { "content-type": "application/json" },
});
const test6 = isRequestAdminAuthorized(req3, { password: configuredPassword });
console.log(`6. Request with body password: ${test6 ? "✅ PASS" : "❌ FAIL"}`);

// 7. Request with token in JSON body
const test7 = isRequestAdminAuthorized(req3, { token: b64Token });
console.log(`7. Request with body token: ${test7 ? "✅ PASS" : "❌ FAIL"}`);

// 8. Request with cookie
const req4 = new Request("http://localhost:3000/api/admin/trigger", {
  method: "POST",
  headers: { cookie: `predictedge_admin_token=${b64Token}` },
});
const test8 = isRequestAdminAuthorized(req4);
console.log(`8. Request with cookie: ${test8 ? "✅ PASS" : "❌ FAIL"}`);

// 9. Unauthorized request with wrong password
const test9 = !verifyAdminToken("wrong_password");
console.log(`9. Reject wrong password: ${test9 ? "✅ PASS" : "❌ FAIL"}`);

const allPassed = [test1, test2, test3, test4, test5, test6, test7, test8, test9].every(Boolean);
console.log(`\n🏁 Overall result: ${allPassed ? "ALL 9 TESTS PASSED ✅" : "SOME TESTS FAILED ❌"}`);

