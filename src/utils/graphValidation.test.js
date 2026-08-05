import { validateCourseGraph } from './graphValidation.js';

function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // Test 1: Valid DAG
  {
    const nodes = [
      { id: 1, label: 'Node 1' },
      { id: 2, label: 'Node 2' },
      { id: 3, label: 'Node 3' }
    ];
    const edges = [
      { from: 1, to: 2 },
      { from: 2, to: 3 }
    ];
    const result = validateCourseGraph(nodes, edges);
    assert(result.valid === true && result.errors.length === 0, 'Valid DAG test');
  }

  // Test 2: Duplicate Node IDs
  {
    const nodes = [
      { id: 1, label: 'Node 1' },
      { id: 1, label: 'Node 1 Duplicate' },
      { id: 2, label: 'Node 2' }
    ];
    const edges = [{ from: 1, to: 2 }];
    const result = validateCourseGraph(nodes, edges);
    assert(result.valid === false && result.errors.some(e => e.includes('Duplicate node IDs')), 'Duplicate node IDs test');
  }

  // Test 3: Non-existent Edge Target
  {
    const nodes = [
      { id: 1, label: 'Node 1' },
      { id: 2, label: 'Node 2' }
    ];
    const edges = [
      { from: 1, to: 2 },
      { from: 2, to: 999 }
    ];
    const result = validateCourseGraph(nodes, edges);
    assert(result.valid === false && result.errors.some(e => e.includes('non-existent node IDs')), 'Non-existent edge target test');
  }

  // Test 4: Cycle Detection
  {
    const nodes = [
      { id: 1, label: 'Node 1' },
      { id: 2, label: 'Node 2' }
    ];
    const edges = [
      { from: 1, to: 2 },
      { from: 2, to: 1 }
    ];
    const result = validateCourseGraph(nodes, edges);
    assert(result.valid === false && result.errors.some(e => e.includes('Cycle detected')), 'Cycle detection test');
  }

  // Test 5: Orphan/Unreachable Node
  {
    const nodes = [
      { id: 1, label: 'Root Node' },
      { id: 2, label: 'Connected Node' },
      { id: 3, label: 'Orphan Node' }
    ];
    const edges = [
      { from: 1, to: 2 }
    ];
    const result = validateCourseGraph(nodes, edges);
    assert(result.valid === false && result.errors.some(e => e.includes('Orphan/unreachable nodes')), 'Orphan node test');
  }

  // Test 6: Empty Nodes
  {
    const result = validateCourseGraph([], []);
    assert(result.valid === false && result.errors.includes('Nodes list is empty or invalid'), 'Empty nodes test');
  }

  // Test 7: Non-topological node list order (root node is at index 1)
  {
    const nodes = [
      { id: 2, label: 'Second Node in DAG' },
      { id: 1, label: 'Root Node (index 1)' },
      { id: 3, label: 'Third Node' }
    ];
    const edges = [
      { from: 1, to: 2 },
      { from: 2, to: 3 }
    ];
    const result = validateCourseGraph(nodes, edges);
    assert(result.valid === true && result.errors.length === 0, 'Non-topological node order test');
  }

  // Test 8: Node missing an ID
  {
    const nodes = [
      { id: 1, label: 'Valid Node' },
      { label: 'Node without ID' }
    ];
    const edges = [];
    const result = validateCourseGraph(nodes, edges);
    assert(result.valid === false && result.errors.some(e => e.includes("missing a valid 'id'")), 'Missing node ID test');
  }

  console.log(`\nSummary: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
