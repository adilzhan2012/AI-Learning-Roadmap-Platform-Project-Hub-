import { parseAIJson, AIParsingError } from "./aiResponseParser.js";

function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log("✅ PASS: " + message);
      passed++;
    } else {
      console.error("❌ FAIL: " + message);
      failed++;
    }
  }

  // Test 1: Valid JSON object
  {
    const input = "{\"title\": \"Test Course\", \"nodes\": [1, 2]}";
    const parsed = parseAIJson(input);
    assert(parsed.title === "Test Course" && parsed.nodes.length === 2, "Valid JSON object parsing");
  }

  // Test 2: JSON with markdown code fences
  {
    const input = "```json\n{\n  \"score\": 90,\n  \"passed\": true\n}\n```";
    const parsed = parseAIJson(input);
    assert(parsed.score === 90 && parsed.passed === true, "JSON with markdown code fence parsing");
  }

  // Test 3: Truncated / malformed JSON
  {
    const input = "```json\n{\n  \"title\": \"Unfinished course\",\n  \"nodes\": [";
    let caught = null;
    try {
      parseAIJson(input);
    } catch (e) {
      caught = e;
    }
    assert(
      caught instanceof AIParsingError && caught.rawText === input,
      "Truncated JSON throws AIParsingError with rawText preserved"
    );
  }

  // Test 4: JSON surrounded by text before and after
  {
    const input = "Here is the generated output:\n{\n  \"result\": \"ok\"\n}\nHope this helps!";
    const parsed = parseAIJson(input);
    assert(parsed.result === "ok", "JSON surrounded by text before and after parsing");
  }

  // Test 5: Conversational preamble with ```json ... ``` code fence
  {
    const input = "Here are your flashcards:\n```json\n[\n  {\"term\": \"Closure\", \"definition\": \"A function bundled with its lexical environment\"}\n]\n```\nHope this helps with your studies!";
    const parsed = parseAIJson(input);
    assert(Array.isArray(parsed) && parsed[0].term === "Closure", "Conversational preamble with ```json code fence parsing");
  }

  // Test 6: Empty / non-string input
  {
    let caught = null;
    try {
      parseAIJson(null);
    } catch (e) {
      caught = e;
    }
    assert(caught instanceof AIParsingError, "Empty or null input throws AIParsingError");
  }

  console.log("\nAI Response Parser Summary: " + passed + " passed, " + failed + " failed.");
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
