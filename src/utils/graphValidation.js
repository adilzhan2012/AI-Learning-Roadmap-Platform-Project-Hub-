export function validateCourseGraph(nodes, edges) {
  const errors = [];

  if (!Array.isArray(nodes) || nodes.length === 0) {
    return {
      valid: false,
      errors: ['Nodes list is empty or invalid']
    };
  }

  const safeEdges = Array.isArray(edges) ? edges : [];

  // 1. Check duplicate and missing node IDs
  const seenIds = new Set();
  const duplicateIds = new Set();
  let missingIdCount = 0;

  for (const node of nodes) {
    if (!node || node.id === undefined || node.id === null || node.id === '') {
      missingIdCount++;
    } else {
      if (seenIds.has(node.id)) {
        duplicateIds.add(node.id);
      } else {
        seenIds.add(node.id);
      }
    }
  }

  if (missingIdCount > 0) {
    errors.push(`Found ${missingIdCount} node(s) missing a valid 'id' property.`);
  }

  if (duplicateIds.size > 0) {
    errors.push(`Duplicate node IDs found: ${Array.from(duplicateIds).join(', ')}.`);
  }

  // 2. Check edges target existing node IDs
  const invalidEdges = [];
  for (const edge of safeEdges) {
    if (!edge) continue;
    const fromExists = seenIds.has(edge.from);
    const toExists = seenIds.has(edge.to);

    if (!fromExists || !toExists) {
      invalidEdges.push(`Edge from '${edge.from}' to '${edge.to}' (missing: ${[!fromExists && 'from (' + edge.from + ')', !toExists && 'to (' + edge.to + ')'].filter(Boolean).join(', ')})`);
    }
  }

  if (invalidEdges.length > 0) {
    errors.push(`Edges reference non-existent node IDs: ${invalidEdges.join('; ')}`);
  }

  // If there are duplicate IDs or invalid edges, cycle/connectivity checks may produce misleading results,
  // but we can still proceed safely on valid node references.
  
  // Build adjacency list & in-degree map for valid nodes and edges
  const adj = new Map();
  const inDegree = new Map();

  for (const id of seenIds) {
    adj.set(id, []);
    inDegree.set(id, 0);
  }

  for (const edge of safeEdges) {
    if (edge && seenIds.has(edge.from) && seenIds.has(edge.to)) {
      adj.get(edge.from).push(edge.to);
      inDegree.set(edge.to, inDegree.get(edge.to) + 1);
    }
  }

  // 3. Cycle Detection using Kahn's Algorithm (Topological Sort)
  const queue = [];
  for (const [id, count] of inDegree.entries()) {
    if (count === 0) {
      queue.push(id);
    }
  }

  let processedCount = 0;
  const inDegreeCopy = new Map(inDegree);
  const qCopy = [...queue];

  while (qCopy.length > 0) {
    const curr = qCopy.shift();
    processedCount++;

    for (const neighbor of adj.get(curr)) {
      inDegreeCopy.set(neighbor, inDegreeCopy.get(neighbor) - 1);
      if (inDegreeCopy.get(neighbor) === 0) {
        qCopy.push(neighbor);
      }
    }
  }

  if (processedCount < seenIds.size) {
    errors.push('Cycle detected in course graph. Graph must be a Directed Acyclic Graph (DAG).');
  }

  // 4. Connectivity check relative to starting/root node
  // A course graph must have a starting point (node 0 / root).
  const rootIds = Array.from(seenIds).filter(id => inDegree.get(id) === 0);

  if (rootIds.length === 0) {
    errors.push('No root node found: every node has at least one incoming edge (likely part of a cycle).');
  } else {
    // Starting node is preferred to be nodes[0].id if it has inDegree 0, otherwise rootIds[0]
    const primaryStartId = (nodes[0] && seenIds.has(nodes[0].id) && inDegree.get(nodes[0].id) === 0) 
      ? nodes[0].id 
      : rootIds[0];

    const reachable = new Set([primaryStartId]);
    const bfsQueue = [primaryStartId];

    while (bfsQueue.length > 0) {
      const curr = bfsQueue.shift();
      for (const neighbor of adj.get(curr) || []) {
        if (!reachable.has(neighbor)) {
          reachable.add(neighbor);
          bfsQueue.push(neighbor);
        }
      }
    }

    const unreachableIds = [];
    for (const id of seenIds) {
      if (!reachable.has(id)) {
        unreachableIds.push(id);
      }
    }

    if (unreachableIds.length > 0) {
      errors.push(`Orphan/unreachable nodes found that cannot be reached from root node (ID: ${primaryStartId}): ${unreachableIds.join(', ')}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
