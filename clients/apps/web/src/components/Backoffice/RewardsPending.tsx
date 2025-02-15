'use client'

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/20/solid'
import Link from 'next/link'
import { api } from 'polarkit/api'
import { BackofficeReward, PledgeState } from 'polarkit/api/client'
import { ThinButton } from 'polarkit/components/ui'
import { useBackofficeRewardsPending } from 'polarkit/hooks'
import { getCentsInDollarString } from 'polarkit/money'
import { classNames } from 'polarkit/utils'
import { useMemo } from 'react'

const Pledges = () => {
  const rewards = useBackofficeRewardsPending()

  const groupRewardsByPledge = (
    rewards: Array<BackofficeReward>,
  ): Array<Array<BackofficeReward>> => {
    const byPledgeId =
      rewards.reduce(
        (hash: Record<string, Array<BackofficeReward>>, obj) => ({
          ...hash,
          [obj.pledge.id]: (hash[obj.pledge.id] || []).concat(obj),
        }),
        {},
      ) || {}
    return Object.values(byPledgeId)
  }

  const groupRewardsByIssue = (
    rewards: Array<BackofficeReward>,
  ): Array<Array<BackofficeReward>> => {
    const byIssueId =
      rewards.reduce(
        (hash: Record<string, Array<BackofficeReward>>, obj) => ({
          ...hash,
          [obj.pledge.issue.id]: (hash[obj.pledge.issue.id] || []).concat(obj),
        }),
        {},
      ) || {}
    return Object.values(byIssueId)
  }

  const issueList = useMemo(() => {
    return groupRewardsByIssue(rewards.data?.items || []).map((r) =>
      groupRewardsByPledge(r),
    )
    // const byIssue =
    //   rewards.data?.items?.reduce(
    //     (hash: Record<string, Array<BackofficeReward>>, obj) => ({
    //       ...hash,
    //       [obj.pledge.issue.id]: (hash[obj.pledge.issue.id] || []).concat(obj),
    //     }),
    //     {},
    //   ) || {}

    // return Object.values(byIssue)
  }, [rewards])

  return (
    <div className="space-y-4">
      {issueList.map((i) => (
        <div>
          <div className="flex gap-2">
            <Link
              className="text-blue-600"
              href={`/backoffice/issue/${i[0][0].pledge.issue.id}`}
            >
              {i[0][0].pledge.issue.repository.organization.name}/
              {i[0][0].pledge.issue.repository.name}#
              {i[0][0].pledge.issue.number}
            </Link>

            <span>&quot;{i[0][0].pledge.issue.title}&quot;</span>

            <ThinButton
              color="gray"
              href={`https://github.com/${i[0][0].pledge.issue.repository.organization.name}/${i[0][0].pledge.issue.repository.name}/issues/${i[0][0].pledge.issue.number}`}
            >
              <span>GitHub</span>
              <ArrowTopRightOnSquareIcon />
            </ThinButton>
          </div>
          <div className="flex flex-col gap-2 p-4">
            {i.map((p) => (
              <div
                className="flex flex-col gap-2"
                key={p[0].issue_reward_id + p[0].pledge.id}
              >
                <div className="flex items-center gap-2">
                  <ArrowLeftIcon className="h-4 w-4 text-green-600" />
                  <div>
                    $
                    {getCentsInDollarString(
                      p[0].pledge.amount.amount,
                      true,
                      true,
                    )}{' '}
                    from{' '}
                  </div>
                  {p[0].pledge.pledger?.avatar_url && (
                    <img
                      className="h-6 w-6"
                      src={p[0].pledge.pledger.avatar_url}
                    />
                  )}
                  <div className="underline">
                    {p[0].pledge.pledger?.github_username ||
                      p[0].pledge.pledger?.name ||
                      'Anonymous'}
                  </div>
                  <div>{p[0].pledger_email}</div>
                  <div
                    className={classNames(
                      'flex items-center rounded-full px-2 text-sm text-white',
                      p[0].pledge.state === PledgeState.CHARGE_DISPUTED ||
                        p[0].pledge.state === PledgeState.DISPUTED
                        ? 'bg-red-700'
                        : '',
                      p[0].pledge.state === PledgeState.PENDING
                        ? 'bg-green-700'
                        : '',
                      p[0].pledge.state === PledgeState.CONFIRMATION_PENDING
                        ? 'bg-blue-700'
                        : '',
                      p[0].pledge.state === PledgeState.CREATED
                        ? 'bg-blue-300'
                        : '',
                    )}
                  >
                    {p[0].pledge.state}
                  </div>
                  <ThinButton
                    color="gray"
                    href={`https://dashboard.stripe.com/payments/${p[0].pledge_payment_id}`}
                  >
                    <span>Payment</span>
                    <ArrowTopRightOnSquareIcon />
                  </ThinButton>

                  <div>
                    scheduled_payout_at = {p[0].pledge.scheduled_payout_at}
                  </div>
                </div>

                {p.map((r) => (
                  <div className="flex items-center gap-2">
                    <ArrowRightIcon className="h-4 w-4 text-blue-600" />
                    <div>
                      ${getCentsInDollarString(r.amount.amount, true, true)} to
                    </div>
                    {r.user && (
                      <>
                        <img className="h-6 w-6" src={r.user.avatar_url} />
                        <div className="underline">{r.user.username}</div>
                      </>
                    )}
                    {r.organization && (
                      <>
                        <img
                          className="h-6 w-6"
                          src={r.organization.avatar_url}
                        />
                        <div className="underline">{r.organization.name}</div>
                      </>
                    )}
                    {!r.paid_at && (
                      <>
                        <div className="flex items-center rounded-full bg-green-400 px-2 text-sm text-white">
                          not paid out
                        </div>

                        <ThinButton
                          color="blue"
                          onClick={async () => {
                            await api.backoffice.pledgeRewardTransfer({
                              requestBody: {
                                pledge_id: r.pledge.id,
                                issue_reward_id: r.issue_reward_id,
                              },
                            })
                            alert('paid!')
                          }}
                        >
                          <span>Create transfer</span>
                          <CurrencyDollarIcon />
                        </ThinButton>
                      </>
                    )}

                    {r.paid_at && (
                      <div className="flex items-center rounded-full bg-green-400 px-2 text-sm text-white">
                        Paid {r.paid_at}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default Pledges
