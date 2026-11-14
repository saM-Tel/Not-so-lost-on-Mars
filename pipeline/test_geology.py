# WHAT:    Tests for the polygon cutting in build_geology.py.
# IN:      Nothing. The rings below are made-up test fixtures on a unit box, with expected corners worked by hand.
# OUT:     Pass or fail.
# USED BY: pytest.
# RULES:   Needs no fiona: only the pure-Python cutting is tested.
# TRAPS:   PITFALLS 4.
# OWNER:   Role A.

import build_geology

BOX = (0.0, 1.0, 0.0, 1.0)  # west, east, south, north


def test_ring_inside_the_box_is_kept_and_closed():
    ring = [(0.2, 0.2), (0.8, 0.2), (0.8, 0.8), (0.2, 0.8), (0.2, 0.2)]
    assert build_geology.clip_ring(ring, *BOX) == [[0.2, 0.2], [0.8, 0.2], [0.8, 0.8], [0.2, 0.8], [0.2, 0.2]]


def test_ring_across_the_east_edge_is_cut_on_that_edge():
    # A square from x 0.5 to 1.5: the part east of x = 1 goes, with new corners on the edge.
    ring = [(0.5, 0.25), (1.5, 0.25), (1.5, 0.75), (0.5, 0.75), (0.5, 0.25)]
    clipped = build_geology.clip_ring(ring, *BOX)
    assert clipped[0] == clipped[-1]
    assert sorted(map(tuple, clipped[:-1])) == [(0.5, 0.25), (0.5, 0.75), (1.0, 0.25), (1.0, 0.75)]


def test_ring_outside_the_box_is_dropped():
    ring = [(2.0, 2.0), (3.0, 2.0), (3.0, 3.0), (2.0, 2.0)]
    assert build_geology.clip_ring(ring, *BOX) == []


def test_polygon_keeps_a_hole_inside_and_drops_one_outside():
    outer = [(-1.0, -1.0), (2.0, -1.0), (2.0, 2.0), (-1.0, 2.0), (-1.0, -1.0)]
    hole_inside = [(0.4, 0.4), (0.6, 0.4), (0.6, 0.6), (0.4, 0.4)]
    hole_outside = [(1.5, 1.5), (1.8, 1.5), (1.8, 1.8), (1.5, 1.5)]
    polygon = build_geology.clip_polygon([outer, hole_inside, hole_outside], *BOX)
    assert len(polygon) == 2
    assert sorted(map(tuple, polygon[0][:-1])) == [(0.0, 0.0), (0.0, 1.0), (1.0, 0.0), (1.0, 1.0)]


def test_positions_are_rounded_to_five_decimals():
    ring = [(0.1234567, 0.1), (0.9, 0.1), (0.9, 0.9), (0.1234567, 0.1)]
    assert build_geology.clip_ring(ring, *BOX)[0] == [0.12346, 0.1]
