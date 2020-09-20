import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router";
import TimeAgoWrapper from "app/components/elements/TimeAgoWrapper";
// import Icon from 'app/components/elements/Icon';
import Memo from "app/components/elements/Memo";
import { numberWithCommas, coinsToSp } from "app/utils/StateFunctions";
import tt from "counterpart";
import GDPRUserList from "app/utils/GDPRUserList";

class TransferHistoryRow extends React.Component {
  render() {
    const {
      op,
      context,
      curation_reward,
      author_reward,
      benefactor_reward,
      powerdown_coins,
      reward_coins
    } = this.props;
    // context -> account perspective

    const type = op[1].op[0];
    const data = op[1].op[1];

    /*  all transfers involve up to 2 accounts, context and 1 other. */
    let message = "";

    let description_start = "";
    let other_account = null;
    let description_end = "";

    if (type === "transfer_to_coining") {
      const amount = data.amount.split(" ")[0];

      if (data.from === context) {
        if (data.to === "") {
          message = tt(
            "transferhistoryrow_jsx.transfer_to_coining.from_self.no_to",
            { amount }
          );
          // tt('g.transfer') + amount + tt('g.to') + 'VOILK POWER';
        } else {
          message = (
            <span>
              {tt(
                "transferhistoryrow_jsx.transfer_to_coining.from_self.to_someone",
                { amount }
              )}
              {otherAccountLink(data.to)}
            </span>
          );
          // tt('g.transfer') + amount + ' VOILK POWER' + tt('g.to');
        }
      } else if (data.to === context) {
        message = (
          <span>
            {tt("transferhistoryrow_jsx.transfer_to_coining.to_self", {
              amount
            })}
            {otherAccountLink(data.from)}
          </span>
        );
        // tt('g.receive') + amount + ' VOILK POWER' + tt('g.from');
      } else {
        message = (
          <span>
            {tt(
              "transferhistoryrow_jsx.transfer_to_coining.from_user_to_user",
              {
                amount,
                from: data.from
              }
            )}
            {otherAccountLink(data.to)}
          </span>
        );
        // tt('g.transfer') + amount + ' VOILK POWER' + tt('g.from') +data.from + tt('g.to');
      }
    } else if (
      /^transfer$|^transfer_to_savings$|^transfer_from_savings$/.test(type)
    ) {
      // transfer_to_savings
      const fromWhere =
        type === "transfer_to_savings"
          ? "to_savings"
          : type === "transfer_from_savings" ? "from_savings" : "not_savings";

      if (data.from === context) {
        // Semi-bad behavior - passing `type` to translation engine -- @todo better somehow?
        // type can be to_savings, from_savings, or not_savings
        // Also we can't pass React elements (link to other account) so its order is fixed :()
        message = (
          <span>
            {tt(
              ["transferhistoryrow_jsx", "transfer", "from_self", fromWhere],
              { amount: data.amount }
            )}
            {otherAccountLink(data.to)}
            {data.request_id &&
              tt("transferhistoryrow_jsx.request_id", {
                request_id: data.request_id
              })}
          </span>
        );
        // tt('g.transfer') + `${fromWhere} ${data.amount}` + tt('g.to');
      } else if (data.to === context) {
        message = (
          <span>
            {tt(["transferhistoryrow_jsx", "transfer", "to_self", fromWhere], {
              amount: data.amount
            })}
            {otherAccountLink(data.from)}
            {data.request_id &&
              tt("transferhistoryrow_jsx.request_id", {
                request_id: data.request_id
              })}
          </span>
        );
        // tt('g.receive') + `${fromWhere} ${data.amount}` + tt('g.from');
      } else {
        // Removing the `from` link from this one -- only one user is linked anyways.
        message = (
          <span>
            {tt(
              [
                "transferhistoryrow_jsx",
                "transfer",
                "to_someone_from_someone",
                fromWhere
              ],
              {
                amount: data.amount,
                from: data.from,
                to: data.to
              }
            )}
            {data.request_id &&
              " " +
                tt("transferhistoryrow_jsx.request_id", {
                  request_id: data.request_id
                })}
          </span>
        );
        // tt('g.transfer') + `${fromWhere} ${data.amount}` + tt('g.from');
        //other_account = data.from;
        //description_end += tt('g.to') + data.to;
      }
    } else if (type === "cancel_transfer_from_savings") {
      message = tt("transferhistoryrow_jsx.cancel_transfer_from_savings", {
        request_id: data.request_id
      });
      // `${tt('transferhistoryrow_jsx.cancel_transfer_from_savings')} (${tt('g.request')} ${data.request_id})`;
    } else if (type === "withdraw_coining") {
      if (data.coining_shares === "0.000000 COINS")
        message = tt("transferhistoryrow_jsx.stop_power_down");
      else
        message = tt("transferhistoryrow_jsx.withdraw_coining", {
          powerdown_coins
        });
      // tt('transferhistoryrow_jsx.start_power_down_of') + ' ' + powerdown_coins + ' VOILK';
    } else if (type === "curation_reward") {
      const linkToComment = data.comment_author + "/" + data.comment_permlink;
      message = (
        <span>
          {tt("transferhistoryrow_jsx.curation_reward", {
            curation_reward
          })}
          {otherAccountLink(linkToComment)}
        </span>
      );
      // `${curation_reward} VOILK POWER` + tt('g.for');
    } else if (type === "author_reward") {
      let voilk_payout = "";
      if (data.voilk_payout !== "0.000 VOILK")
        voilk_payout = ", " + data.voilk_payout;
      message = (
        <span>
          {tt("transferhistoryrow_jsx.author_reward", {
            author_reward,
            voilk_payout,
            vsd_payout: data.vsd_payout
          })}
          {otherAccountLink(data.author + "/" + data.permlink)}
        </span>
      );
      // `${data.vsd_payout}${voilk_payout}, ${tt( 'g.and' )} ${author_reward} VOILK POWER ${tt('g.for')}`;
    } else if (type === "claim_reward_balance") {
      const rewards = [];
      if (parseFloat(data.reward_voilk.split(" ")[0]) > 0)
        rewards.push(data.reward_voilk);
      if (parseFloat(data.reward_vsd.split(" ")[0]) > 0)
        rewards.push(data.reward_vsd);
      if (parseFloat(data.reward_coins.split(" ")[0]) > 0)
        rewards.push(`${reward_coins} VOILK POWER`);

      switch (rewards.length) {
        case 3:
          message = tt(
            "transferhistoryrow_jsx.claim_reward_balance.three_rewards",
            {
              first_reward: rewards[0],
              second_reward: rewards[1],
              third_reward: rewards[2]
            }
          );
          // `${rewards[0]}, ${rewards[1]} and ${ rewards[2] }`;
          break;
        case 2:
          message = tt(
            "transferhistoryrow_jsx.claim_reward_balance.two_rewards",
            { first_reward: rewards[0], second_reward: rewards[1] }
          );
          // `${rewards[0]} and ${rewards[1]}`;
          break;
        case 1:
          message = tt(
            "transferhistoryrow_jsx.claim_reward_balance.one_reward",
            { reward: rewards[0] }
          );
          // `${rewards[0]}`;
          break;
      }
    } else if (type === "interest") {
      message = tt("transferhistoryrow_jsx.interest", {
        interest: data.interest
      });
      // `${tt( 'transferhistoryrow_jsx.receive_interest_of' )} ${data.interest}`;
    } else if (type === "fill_convert_request") {
      message = tt("transferhistoryrow_jsx.fill_convert_request", {
        amount_in: data.amount_in,
        amount_out: data.amount_out
      });
      // `Fill convert request: ${data.amount_in} for ${ data.amount_out }`;
    } else if (type === "fill_order") {
      if (data.open_owner == context) {
        // my order was filled by data.current_owner
        message = tt(
          "transferhistoryrow_jsx.fill_order.filled_by_current_owner",
          {
            open_pays: data.open_pays,
            current_pays: data.current_pays
          }
        );
        // `Paid ${data.open_pays} for ${  data.current_pays }`
      } else {
        // data.open_owner filled my order
        message = tt(
          "transferhistoryrow_jsx.fill_order.open_owner_filled_my_order",
          {
            open_pays: data.open_pays,
            current_pays: data.current_pays
          }
        );
        // `Paid ${data.current_pays} for ${ data.open_pays }`;
      }
    } else if (type === "comment_benefactor_reward") {
      message = tt("transferhistoryrow_jsx.comment_benefactor_reward", {
        benefactor_reward,
        author: data.author,
        permlink: data.permlink
      });
      // `${benefactor_reward} VOILK POWER for ${ data.author }/${data.permlink}`;
    } else {
      message = JSON.stringify({ type, ...data }, null, 2);
    }
    // <Icon name="clock" className="space-right" />
    return (
      <tr key={op[0]} className="Trans">
        <td>
          <TimeAgoWrapper date={op[1].timestamp} />
        </td>
        <td className="TransferHistoryRow__text" style={{ maxWidth: "40rem" }}>
          {message}
        </td>
        <td
          className="show-for-medium"
          style={{ maxWidth: "40rem", wordWrap: "break-word" }}
        >
          <Memo text={data.memo} username={context} />
        </td>
      </tr>
    );
  }
}

const otherAccountLink = username =>
  GDPRUserList.includes(username) ? (
    <span>{username}</span>
  ) : (
    <Link to={`/@${username}`}>{username}</Link>
  );

export default connect(
  // mapStateToProps
  (state, ownProps) => {
    const op = ownProps.op;
    const type = op[1].op[0];
    const data = op[1].op[1];
    const powerdown_coins =
      type === "withdraw_coining"
        ? numberWithCommas(coinsToSp(state, data.coining_shares))
        : undefined;
    const reward_coins =
      type === "claim_reward_balance"
        ? numberWithCommas(coinsToSp(state, data.reward_coins))
        : undefined;
    const curation_reward =
      type === "curation_reward"
        ? numberWithCommas(coinsToSp(state, data.reward))
        : undefined;
    const author_reward =
      type === "author_reward"
        ? numberWithCommas(coinsToSp(state, data.coining_payout))
        : undefined;
    const benefactor_reward =
      type === "comment_benefactor_reward"
        ? numberWithCommas(coinsToSp(state, data.reward))
        : undefined;
    return {
      ...ownProps,
      curation_reward,
      author_reward,
      benefactor_reward,
      powerdown_coins,
      reward_coins
    };
  }
)(TransferHistoryRow);
