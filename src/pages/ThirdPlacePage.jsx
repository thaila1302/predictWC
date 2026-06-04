import KnockoutRoundPage from '../components/KnockoutRoundPage';
import thirdPlaceSeed from '../../data/third-place.json';

export default function ThirdPlacePage() {
  return (
    <KnockoutRoundPage
      roundKey="third_place"
      roundLabel="Hạng ba"
      emptyTitle="Chưa có trận hạng ba nào"
      emptyHint="Hãy nhập `data/third-place.json` hoặc dữ liệu Firestore tương ứng."
      seedData={thirdPlaceSeed}
      teamNameOverride="Chờ đội"
    />
  );
}
