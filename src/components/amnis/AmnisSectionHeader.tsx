import { List, Icon } from "@raycast/api";

export default function AmnisSectionHeader() {
  return (
    <List.Section title="Amnis Staking Operations">
      <List.Item
        icon={Icon.Star}
        title="Amnis - Liquid Staking on Aptos"
        subtitle="Stake APT to earn yields"
      />
    </List.Section>
  );
}
