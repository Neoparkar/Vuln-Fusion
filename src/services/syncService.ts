import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SYNTHETIC_ASSET_RECORDS } from '../data/syntheticDataset';
import { SYNTHETIC_FINDINGS } from '../data/syntheticFindings';
import { runCorrelationEngine } from '../engine/correlationEngine';

export const syncService = {
  async syncDemoDataIfNeeded(organizationId: string = '00000000-0000-0000-0000-000000000001') {
    if (!isSupabaseConfigured) return;
    try {
      const { count, error } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      if (error) {
        console.error('Error checking asset sync status:', error.message);
        return;
      }

      if (count && count > 0) {
        return;
      }

      const clusters = runCorrelationEngine(SYNTHETIC_ASSET_RECORDS);
      const clusterToAssetIdMap = new Map<string, string>();

      for (const cluster of clusters) {
        const { data: insertedAsset, error: assetErr } = await supabase
          .from('assets')
          .insert({
            organization_id: organizationId,
            asset_name: cluster.canonicalHostname,
            status: 'ACTIVE',
            first_seen: cluster.representativeRecords[0]?.firstObserved || new Date().toISOString(),
            last_seen: cluster.representativeRecords[0]?.lastObserved || new Date().toISOString(),
          })
          .select('id')
          .single();

        if (assetErr) {
          console.error('Error inserting asset:', assetErr.message);
          continue;
        }

        if (insertedAsset) {
          clusterToAssetIdMap.set(cluster.underlyingAssetId, insertedAsset.id);

          await supabase.from('correlations').insert({
            organization_id: organizationId,
            asset_id: insertedAsset.id,
            confidence: cluster.confidence,
            decision: cluster.correlationStatus,
            evidence: cluster.correlationEvidence,
          });
        }
      }

      for (const record of SYNTHETIC_ASSET_RECORDS) {
        const matchingCluster = clusters.find(c => c.memberRecordIds.includes(record.recordId));
        const dbAssetId = matchingCluster ? clusterToAssetIdMap.get(matchingCluster.underlyingAssetId) : null;

        await supabase.from('source_records').insert({
          organization_id: organizationId,
          asset_id: dbAssetId || null,
          source: record.sourceTool,
          hostname: record.hostname,
          ip_address: record.ipAddresses[0] || null,
          mac_address: record.macAddress || null,
          bios_uuid: record.biosUuid || null,
          cloud_resource_id: record.cloudResourceId || null,
          raw_identity: record as any,
          observed_at: record.lastObserved || new Date().toISOString(),
        });
      }

      for (const finding of SYNTHETIC_FINDINGS) {
        const dbAssetId = finding.underlyingAssetGroupId ? clusterToAssetIdMap.get(finding.underlyingAssetGroupId) : null;

        await supabase.from('findings').insert({
          organization_id: organizationId,
          asset_id: dbAssetId || null,
          source: finding.sourceTool,
          vulnerability_id: finding.vulnerabilityId,
          vulnerability_id_type: finding.vulnerabilityIdType || 'CVE',
          severity: finding.severity,
          status: finding.status || 'ACTIVE',
          title: finding.title,
          description: finding.evidenceSnippet || finding.title,
          first_seen: finding.firstObserved || new Date().toISOString(),
          last_seen: finding.lastObserved || new Date().toISOString(),
        });
      }

      console.log('VulnFusion Demo dataset successfully synchronized to Supabase PostgreSQL.');
    } catch (err) {
      console.error('Error syncing demo dataset:', err);
    }
  },
};
