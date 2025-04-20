const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cve')
    .setDescription('Fetches information about a specific CVE')
    .addStringOption(option =>
      option.setName('id')
        .setDescription('The CVE ID (e.g., CVE-2024-1234)')
        .setRequired(true)),

  async execute(interaction) {
    const cveId = interaction.options.getString('id');
    
    try {
      const response = await axios.get(`https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${cveId}`);
      const cveData = response.data.vulnerabilities[0].cve;
      
      const description = cveData.descriptions[0].value;
      const severity = cveData.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore || 'Not available';
      
      await interaction.reply({
        content: `🔍 **${cveId}**\n📝 **Description:** ${description}\n⚠️ **Severity Score:** ${severity}`,
        ephemeral: true
      });
    } catch (error) {
      console.error('CVE API Error:', error);
      await interaction.reply({
        content: '❌ Error fetching CVE information. Please check the CVE ID and try again.',
        ephemeral: true
      });
    }
  }
}; 