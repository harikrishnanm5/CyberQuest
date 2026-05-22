/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * RAG Service for CyberQuest.
 * Queries Qdrant threat_intel collection for relevant cybersecurity context.
 */

export const queryThreats = async (domain: string, difficulty: string): Promise<string> => {
  const QDRANT_URL = import.meta.env.VITE_QDRANT_URL || "http://localhost:6333";
  const COLLECTION = "threat_intel";

  try {
    // In a real scenario, we would use an embedding model to generate a vector.
    // For this implementation, we'll use Qdrant's filter-based search or a simplified 
    // mock query if the vector-search endpoint is too complex to implement without a client.
    // Since we are in a browser/Vite environment, we'll use fetch.
    
    const response = await fetch(`${QDRANT_URL}/collections/${COLLECTION}/points/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Placeholder for semantic search. Since we don't have an embedding model in-browser
        // easily accessible, we'll use a dummy vector or a scroll if search fails.
        // In a production app, the backend would handle embedding.
        vector: Array(384).fill(0), // Dummy vector for schema compliance
        filter: {
          must: [
            { key: "domain", match: { value: domain } },
            { key: "difficulty", match: { value: difficulty } }
          ]
        },
        limit: 3,
        with_payload: true
      })
    });

    if (!response.ok) {
      console.warn("Qdrant query failed, proceeding without RAG context.");
      return "";
    }

    const data = await response.json();
    const results = data.result || [];

    if (results.length === 0) return "";

    const context = results.map((res: any, idx: number) => {
      const p = res.payload || {};
      return `[RESULT ${idx + 1}] Title: ${p.title || 'Unknown'} | CVE: ${p.cve || 'N/A'} | Summary: ${p.summary || 'No summary'}`;
    }).join("\n");

    return `\nRELEVANT THREAT CONTEXT:\n${context}\n`;
  } catch (err) {
    console.error("RAG Service Error:", err);
    return "";
  }
};
