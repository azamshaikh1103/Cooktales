import { addVerifiedBadge, COOKTALE_ACCOUNT_ID } from './verified-badge';

describe('addVerifiedBadge', () => {
  it('marks paid and official accounts, including nested authors, without trusting usernames', () => {
    const result = addVerifiedBadge({ authors: [
      { id: 'paid', username: 'chef', isPro: true },
      { id: COOKTALE_ACCOUNT_ID, username: 'renamed', isPro: false },
      { id: 'other', username: 'cooktale', isPro: false },
    ] });
    expect(result.authors.map((author) => (author as typeof author & { isVerifiedBadge: boolean }).isVerifiedBadge)).toEqual([true, true, false]);
  });
});
