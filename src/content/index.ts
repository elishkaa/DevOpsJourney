import type { Challenge } from '../types/challenge'
import { linuxChallenges } from './challenges/linux'
import { gitChallenges } from './challenges/git'
import { networkingChallenges } from './challenges/networking'
import { dockerChallenges } from './challenges/docker'
import { kubernetesChallenges } from './challenges/kubernetes'
import { cicdChallenges } from './challenges/cicd'
import { iacChallenges } from './challenges/iac'
import { cloudChallenges } from './challenges/cloud'
import { observabilityChallenges } from './challenges/observability'
import { securityChallenges } from './challenges/security'

/**
 * The seed content bank, sorted by id. Sorting matters: the stateless
 * Challenge-of-the-Day pick (engine/daily.pickCotd) indexes into the sorted
 * id list, and scripts/cotd.mjs must derive the identical order.
 */
export const SEED_BANK: Challenge[] = [
  ...linuxChallenges,
  ...gitChallenges,
  ...networkingChallenges,
  ...dockerChallenges,
  ...kubernetesChallenges,
  ...cicdChallenges,
  ...iacChallenges,
  ...cloudChallenges,
  ...observabilityChallenges,
  ...securityChallenges,
].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
