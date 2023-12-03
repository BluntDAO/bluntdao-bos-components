const limit = 20;
const series = props.series ?? "1"; // add series filter
const title = props.title ?? "Total OG BluntDAO";
const showHeader = props.showHeader ?? true;
const showImage = props.showImage ?? false;
// add what nft they have and then add filter of unique people, add link to collection
// add condition if no props fetch all collection
// add condition to only propose if you have privalige
// fix limit
State.init({
  offset: 0,
  tokens: [],
  hasMore: true,
});

function fetchTokens() {
  asyncFetch("https://graph.mintbase.xyz/mainnet", {
    method: "POST",
    headers: {
      "mb-api-key": "omni-site",
      "Content-Type": "application/json",
      "x-hasura-role": "anonymous",
    },
    body: JSON.stringify({
      query: `
          query MyQuery {
            mb_views_nft_tokens(
               
                offset: ${state.offset}
              where: { nft_contract_id: { _eq: "bluntdao.snft.near" } token_id: {_regex: "^${series}:"}}
              order_by: {minted_timestamp: desc}
            ) {
              media
              owner
            }
          }
        `,
    }),
  }).then((res) => {
    if (res.ok) {
      const tokens = res.body.data.mb_views_nft_tokens;
      if (tokens.length > 0) {
        State.update({
          tokens: [...state.tokens, ...tokens],
          offset: state.offset + limit,
          hasMore: true,
        });
      } else {
        State.update({
          hasMore: false,
        });
      }
    }
  });
}
fetchTokens();
const addEveryone = () => {
  const gas = 200000000000000;
  const deposit = 10000000000000000000000;

  state.tokens?.map((it) => {
    {
      Near.call([
        {
          contractName: daoId,
          methodName: "add_proposal",
          args: {
            proposal: {
              description: "potential member",
              kind: {
                AddMemberToRole: {
                  member_id: it.owner,
                  role: role,
                },
              },
            },
          },
          gas: gas,
          deposit: deposit,
        },
      ]);
    }
  });
};
addEveryone();

const size = "144px";

return (
  <>
    {" "}
    <button className="join-button" onClick={addEveryone}>
      Add Everyone
    </button>
  </>
);
