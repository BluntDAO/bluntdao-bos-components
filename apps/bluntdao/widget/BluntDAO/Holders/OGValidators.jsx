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

const roleCheckThisUser = props.roleCheckThisUser ?? context.accountId; // maybe make conditional if not in dao

const isOG = false;
const roleToCheck = props.roleToCheck ?? "OG BLUNT VALIDATORS";

const proposalKinds = {
  ChangeConfig: "config",
  ChangePolicy: "policy",
  AddMemberToRole: "add_member_to_role",
  RemoveMemberFromRole: "remove_member_from_role",
  FunctionCall: "call",
  UpgradeSelf: "upgrade_self",
  UpgradeRemote: "upgrade_remote",
  Transfer: "transfer",
  SetStakingContract: "set_vote_token",
  AddBounty: "add_bounty",
  BountyDone: "bounty_done",
  Vote: "vote",
  FactoryInfoUpdate: "factory_info_update",
  ChangePolicyAddOrUpdateRole: "policy_add_or_update_role",
  ChangePolicyRemoveRole: "policy_remove_role",
  ChangePolicyUpdateDefaultVotePolicy: "policy_update_default_vote_policy",
  ChangePolicyUpdateParameters: "policy_update_parameters",
};

const actions = {
  AddProposal: "AddProposal",
  VoteApprove: "VoteApprove",
  VoteReject: "VoteReject",
  VoteRemove: "VoteRemove",
};

// -- Get all the roles from the DAO policy
let roles = Near.view(daoId, "get_policy");
roles = roles === null ? [] : roles.roles;

const getUserRoles = (user) => {
  const userRoles = [];
  for (const role of roles) {
    if (role.kind === "Everyone") {
      continue;
    }
    if (!role.kind.Group) continue;
    if (user && role.kind.Group && role.kind.Group.includes(user)) {
      userRoles.push(role.name);
    }
  }
  return userRoles;
};

const isUserAllowedTo = (user, kind, action) => {
  // -- Filter the user roles
  const userRoles = [];
  for (const role of roles) {
    if (role.kind === "Everyone") {
      userRoles.push(role);
      continue;
    }
    if (!role.kind.Group) continue;
    if (user && role.kind.Group && role.kind.Group.includes(user)) {
      userRoles.push(role);
    }
  }

  // -- Check if the user is allowed to perform the action
  let allowed = false;

  userRoles
    .filter(({ permissions }) => {
      const allowedRole =
        permissions.includes(`${kind.toString()}:${action.toString()}`) ||
        permissions.includes(`${kind.toString()}:*`) ||
        permissions.includes(`*:${action.toString()}`) ||
        permissions.includes("*:*");
      allowed = allowed || allowedRole;
      return allowedRole;
    })
    .map((role) => role.name);

  return allowed;
};
const userRoles = accountId ? getUserRoles(roleCheckThisUser) : [];
isOG = userRoles.includes(roleToCheck);

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

function Sharddog({ owner, media }) {
  const size = "100px";

  return (
    <div className="row">
      <div className="col-sm-3">
        {showImage && (
          <Widget
            src="mob.near/widget/Image"
            props={{
              image: {
                url: media,
              },
              style: {
                width: size,
                height: size,
                objectFit: "cover",
                minWidth: size,
                minHeight: size,
                maxWidth: size,
                maxHeight: size,
                overflowWrap: "break-word",
              },
            }}
          />
        )}
      </div>
      <div className="col-sm-12">
        <Widget
          src="bos.bluntdao.near/widget/BluntDAO.member"
          props={{
            accountId: owner,
            isOG: isOG,
          }}
        />
      </div>
    </div>
  );
}

const size = "144px";

const Grid = styled.div`
  display: row;
`;

const loader = (
  <div className="loader" key={"loader"}>
    <span
      className="spinner-grow spinner-grow-sm me-1"
      role="status"
      aria-hidden="true"
    />
    Loading ...
  </div>
);

return (
  <>
    {showHeader && (
      <h1>
        {title}: {state.tokens.length}
      </h1>
    )}

    <InfiniteScroll
      pageStart={0}
      loadMore={fetchTokens}
      hasMore={state.hasMore}
      loader={loader}
    >
      <Grid>
        {state.tokens?.map((it) => {
          return <Sharddog owner={it.owner} media={it.media} />;
        })}
      </Grid>
    </InfiniteScroll>
  </>
);
