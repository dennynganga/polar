'use client'

import IssueList, { Header } from '@/components/Dashboard/IssueList'
import {
  DashboardFilters,
  DefaultFilters,
} from '@/components/Dashboard/filters'
import {
  DashboardBody,
  DashboardHeader,
  RepoPickerHeader,
} from '@/components/Layout/DashboardLayout'
import OnboardingAddBadge from '@/components/Onboarding/OnboardingAddBadge'
import OnboardingInstallChromeExtension from '@/components/Onboarding/OnboardingInstallChromeExtension'
import { useToast } from '@/components/Toast/use-toast'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  IssueListType,
  IssueSortBy,
  IssueStatus,
  Label,
  Organization,
  Repository,
} from 'polarkit/api/client'
import { useDashboard, useListRepositories, useSSE } from 'polarkit/hooks'
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useCurrentOrgAndRepoFromURL } from '../../../../hooks'

export default function ClientPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const orgSlug = searchParams?.get('organization')
  const repoSlug = searchParams?.get('repo')
  const status = searchParams?.get('status')

  const { toast } = useToast()
  const { org, repo, isLoaded } = useCurrentOrgAndRepoFromURL()
  const key = `org-${orgSlug}-repo-${repoSlug}` // use key to force reload of state

  useEffect(() => {
    if (isLoaded && !org) {
      router.push('/maintainer')
      return
    }
  }, [isLoaded, org, router])

  useEffect(() => {
    if (status === 'stripe-connected') {
      toast({
        title: 'Stripe setup complete',
        description: 'Your account is now ready to accept pledges.',
      })
    }
  }, [status, toast])

  if (!isLoaded) {
    return <></>
  }

  return <Issues key={key} org={org} repo={repo} />
}

const buildStatusesFilter = (filters: DashboardFilters): Array<IssueStatus> => {
  const next = []
  filters.statusBacklog && next.push(IssueStatus.BACKLOG)
  filters.statusTriaged && next.push(IssueStatus.TRIAGED)
  filters.statusInProgress && next.push(IssueStatus.IN_PROGRESS)
  filters.statusPullRequest && next.push(IssueStatus.PULL_REQUEST)
  filters.statusClosed && next.push(IssueStatus.CLOSED)
  return next
}

const getSort = (sort: string | null): IssueSortBy => {
  if (sort === 'newest') {
    return IssueSortBy.NEWEST
  }
  if (sort === 'pledged_amount_desc') {
    return IssueSortBy.PLEDGED_AMOUNT_DESC
  }
  if (sort === 'relevance') {
    return IssueSortBy.RELEVANCE
  }
  if (sort === 'dependencies_default') {
    return IssueSortBy.DEPENDENCIES_DEFAULT
  }
  if (sort === 'most_positive_reactions') {
    return IssueSortBy.MOST_POSITIVE_REACTIONS
  }
  if (sort === 'most_engagement') {
    return IssueSortBy.MOST_ENGAGEMENT
  }
  return IssueSortBy.NEWEST
}

const Issues = ({
  org,
  repo,
}: {
  org: Organization | undefined
  repo: Repository | undefined
}) => {
  const search = useSearchParams()

  const initFilters = {
    ...DefaultFilters,
  }

  const didSetFiltersFromURL = useRef(false)

  const [filters, setFilters] = useState<DashboardFilters>(initFilters)

  // TODO: Unless we're sending user-only events we should probably delay SSE
  useSSE(org?.platform, org?.name, undefined)

  useEffect(() => {
    // Parse URL and use it to populate filters
    // TODO: can we do this on the initial load instead to avoid the effect / and ref
    if (!didSetFiltersFromURL.current) {
      didSetFiltersFromURL.current = true

      const s = search

      const f: DashboardFilters = {
        ...DefaultFilters,
        q: s?.get('q') || '',
        tab: IssueListType.ISSUES,
      }
      if (s?.has('statuses')) {
        const stat = s.get('statuses')
        if (stat) {
          const statuses = stat.split(',')
          f.statusBacklog = statuses.includes('backlog')
          f.statusTriaged = statuses.includes('triaged')
          f.statusInProgress = statuses.includes('in_progress')
          f.statusPullRequest = statuses.includes('pull_request')
          f.statusClosed = statuses.includes('closed')
        }
      }
      if (s?.has('sort')) {
        f.sort = getSort(s.get('sort'))
      }
      if (s?.has('onlyPledged')) {
        f.onlyPledged = true
      }
      if (s?.has('onlyBadged')) {
        f.onlyBadged = true
      }

      setFilters(f)
    }
  }, [search])

  let [statuses, setStatuses] = useState<Array<IssueStatus>>(
    buildStatusesFilter(filters),
  )

  useEffect(() => setStatuses(buildStatusesFilter(filters)), [filters])

  if (!org || !org.name) {
    return <></>
  }

  return (
    <OrganizationIssues
      filters={filters}
      onSetFilters={setFilters}
      statuses={statuses}
      orgName={org.name}
      repoName={repo?.name}
    />
  )
}

const OrganizationIssues = ({
  orgName,
  repoName,
  filters,
  statuses,
  onSetFilters,
}: {
  orgName: string
  repoName: string | undefined
  filters: DashboardFilters
  statuses: Array<IssueStatus>
  onSetFilters: Dispatch<SetStateAction<DashboardFilters>>
}) => {
  const dashboardQuery = useDashboard(
    orgName,
    repoName,
    filters.tab,
    filters.q,
    statuses,
    filters.sort,
    filters.onlyPledged,
    filters.onlyBadged,
  )
  const dashboard = dashboardQuery.data
  const totalCount = dashboard?.pages[0].pagination.total_count || undefined

  const haveIssues = useMemo(() => {
    return totalCount !== undefined && totalCount > 0
  }, [totalCount])

  const anyIssueHasPledgeOrBadge = useMemo(() => {
    return dashboardQuery.data?.pages.some((p) =>
      p.data.some(
        (issue) =>
          issue.attributes.labels &&
          issue.attributes.labels.some((l: Label) => l.name === 'polar'),
      ),
    )
  }, [dashboardQuery])

  const isDefaultFilters = useMemo(() => {
    return (
      filters.statusBacklog &&
      filters.statusTriaged &&
      filters.statusInProgress &&
      filters.statusPullRequest &&
      !filters.statusClosed
    )
  }, [filters])

  const showAddBadgeBanner = useMemo(() => {
    return (
      filters.tab === IssueListType.ISSUES &&
      dashboardQuery.isLoading === false &&
      haveIssues &&
      anyIssueHasPledgeOrBadge === false &&
      isDefaultFilters
    )
  }, [
    filters,
    dashboardQuery,
    anyIssueHasPledgeOrBadge,
    haveIssues,
    isDefaultFilters,
  ])

  // Get current org & repo from URL
  const { org: currentOrg, repo: currentRepo } = useCurrentOrgAndRepoFromURL()

  // Get all repositories
  const listRepositoriesQuery = useListRepositories()
  const allRepositories = listRepositoriesQuery?.data?.items
  if (!currentOrg || !allRepositories) {
    return <></>
  }

  // Filter repos by current org & normalize for our select
  const allOrgRepositories = allRepositories.filter(
    (r) => r?.organization?.id === currentOrg.id,
  )

  return (
    <>
      <DashboardHeader>
        <RepoPickerHeader
          currentRepository={currentRepo}
          repositories={allOrgRepositories}
        >
          <Header
            totalCount={totalCount}
            filters={filters}
            onSetFilters={onSetFilters}
            spinner={dashboardQuery.isInitialLoading}
          />
        </RepoPickerHeader>
      </DashboardHeader>

      <DashboardBody>
        <div className="space-y-4">
          <OnboardingInstallChromeExtension />
          {showAddBadgeBanner && <OnboardingAddBadge />}

          <IssueList
            totalCount={totalCount}
            loading={dashboardQuery.isLoading}
            dashboard={dashboard}
            filters={filters}
            onSetFilters={onSetFilters}
            isInitialLoading={dashboardQuery.isInitialLoading}
            isFetchingNextPage={dashboardQuery.isFetchingNextPage}
            hasNextPage={dashboardQuery.hasNextPage || false}
            fetchNextPage={dashboardQuery.fetchNextPage}
          />
        </div>
      </DashboardBody>
    </>
  )
}
