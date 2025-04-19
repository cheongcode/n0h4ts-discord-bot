const axios = require('axios');

module.exports = {
  name: 'cve',
  description: 'Fetches information about a specific CVE',
  options: [
    {
      name: 'id',
      description: 'The CVE ID (e.g., CVE-2024-1234)',
      type: 3, // STRING
      required: true
    }
  ],
  async execute(interaction) {
    const cveId = interaction.options.getString('id');
    
    try {
      const response = await axios.get(`https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${cveId}`);
      const cveData = response.data.vulnerabilities[0].cve;
      
      const description = cveData.descriptions[0].value;
      const severity = cveData.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore || 'Not available';
      
      interaction.reply({
        content: `🔍 **${cveId}**\n📝 **Description:** ${description}\n⚠️ **Severity Score:** ${severity}`,
        ephemeral: true
      });
    } catch (error) {
      console.error('CVE API Error:', error);
      interaction.reply({
        content: '❌ Error fetching CVE information. Please check the CVE ID and try again.',
        ephemeral: true
      });
    }
  }
}; 